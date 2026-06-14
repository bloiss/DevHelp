import { useState, useCallback } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare, ThumbsUp, ThumbsDown, Share2,
  Trash2, EyeOff, Eye, ShieldAlert, MoreHorizontal, CheckCircle, XCircle, Flag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BackButton }        from '@/components/shared/BackButton'
import { CommentThread }     from '@/components/forum/CommentThread'
import { CommentForm }       from '@/components/forum/CommentForm'
import { CommentSkeleton }   from '@/components/forum/CommentSkeleton'
import { Avatar }            from '@/components/shared/Avatar'
import { Badge }             from '@/components/ui/badge'
import { Skeleton }          from '@/components/ui/Skeleton'
import { ConfirmDialog }     from '@/components/shared/ConfirmDialog'
import { TagList }           from '@/components/shared/TagBadge'
import { getCategoryBySlug } from '@/data/categories'
import { inferTags }         from '@/data/postTags'
import { postService }       from '@/services/post.service'
import { adminService }      from '@/services/admin.service'
import { useAuthStore }      from '@/stores/authStore'
import { toast }             from '@/stores/toastStore'
import { ReportDialog }      from '@/components/shared/ReportDialog'
import { formatRelativeDate, cn } from '@/lib/utils'
import type { Comment } from '@/types/post'

export const Route = createFileRoute('/forum/$category/$postId')({
  component: PostPage,
})

/** Regroupe une liste plate de commentaires en arbre (parent_id → replies[]) */
function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment & { replies: Comment[] }>()
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }))

  const roots: (Comment & { replies: Comment[] })[] = []
  flat.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(map.get(c.id)!)
    } else {
      roots.push(map.get(c.id)!)
    }
  })
  return roots
}

/** Compte récursivement tous les commentaires d'un arbre */
function countAll(comments: Comment[]): number {
  return comments.reduce((n, c) => n + 1 + countAll(c.replies ?? []), 0)
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-5 w-28 mb-6" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          {[100, 90, 80, 65].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
          ))}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-7 w-14 rounded-full" />
            <Skeleton className="h-7 w-14 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6 space-y-1">
        <Skeleton className="h-4 w-32" />
        <div>
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      </div>
    </div>
  )
}

function PostPage() {
  const { category: slug, postId } = Route.useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [showReport,     setShowReport]     = useState(false)
  const [activeReplyId,  setActiveReplyId]  = useState<string | null>(null)

  const isAdminOrMod = user?.role === 'admin' || user?.role === 'moderator'

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.get(postId),
  })

  const { data: rawComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!post,
    refetchInterval: 30_000,
  })

  const commentTree = buildCommentTree(rawComments)
  const totalCount = countAll(commentTree)

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postService.vote(postId, value),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const prev = queryClient.getQueryData<any>(['post', postId])
      if (prev) {
        const cur = prev.user_vote
        const toggling = cur === value
        const newVote = toggling ? null : value
        let likes = prev.like_count ?? 0
        let dislikes = prev.dislike_count ?? 0
        if (value === 1) {
          likes = toggling ? Math.max(0, likes - 1) : likes + 1
          if (!toggling && cur === -1) dislikes = Math.max(0, dislikes - 1)
        } else {
          dislikes = toggling ? Math.max(0, dislikes - 1) : dislikes + 1
          if (!toggling && cur === 1) likes = Math.max(0, likes - 1)
        }
        queryClient.setQueryData(['post', postId], { ...prev, like_count: likes, dislike_count: dislikes, user_vote: newVote })
      }
      return { prev }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['post', postId], (old: any) =>
        old ? { ...old, like_count: response.data.like_count, dislike_count: response.data.dislike_count, user_vote: response.data.user_vote } : old
      )
    },
    onError: (_err, _val, context: any) => {
      if (context?.prev) queryClient.setQueryData(['post', postId], context.prev)
      toast.error('Erreur', { description: 'Impossible de voter.' })
    },
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => postService.createComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      postService.createComment(postId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Réponse publiée !')
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de publier la réponse.' }),
  })

  const handleReply = useCallback(
    async (parentId: string, _parentAuthor: string, content: string) => {
      await replyMutation.mutateAsync({ parentId, content })
    },
    [replyMutation],
  )

  const deleteMutation = useMutation({
    mutationFn: () => postService.delete(postId),
    onSuccess: () => {
      toast.success('Post supprimé')
      navigate({ to: `/forum/${slug}` })
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de supprimer.' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, is_hidden }: { status?: string; is_hidden?: boolean }) =>
      adminService.setPostStatus(postId, status ?? post!.status, is_hidden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Statut mis à jour')
      setMenuOpen(false)
    },
    onError: () => toast.error('Erreur'),
  })

  if (isLoading) return <PostDetailSkeleton />
  if (isError || !post) throw notFound()

  const category = getCategoryBySlug(slug)
  const Icon = category?.icon
  const isOwner = user?.id === post.user_id
  const tags = post.tags?.length ? post.tags : inferTags(slug, post.title)

  const STATUS_COLOR: Record<string, string> = {
    pending_moderation: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    flagged:            'bg-orange-500/10 text-orange-500 border-orange-500/20',
    blocked:            'bg-red-500/10 text-red-500 border-red-500/20',
    approved:           '',
  }
  const STATUS_LABEL: Record<string, string> = {
    pending_moderation: 'En attente',
    flagged:            'Signalé',
    blocked:            'Bloqué',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce post ?"
        description="Cette action est irréversible. Le post et tous ses commentaires seront supprimés."
        confirmLabel="Supprimer"
        onConfirm={() => { setConfirmDelete(false); deleteMutation.mutate() }}
        onCancel={() => setConfirmDelete(false)}
      />
      {showReport && (
        <ReportDialog
          postId={postId}
          onClose={() => setShowReport(false)}
        />
      )}

      <BackButton label={category ? `Retour à ${category.name}` : 'Retour'} className="mb-4" />

      {/* ── Post ── */}
      <article className="border-b border-border pb-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <button onClick={() => navigate({ to: '/profile/$username', params: { username: post.author.username } })}>
              <Avatar user={post.author} size="md" className="h-10 w-10 rounded-full hover:opacity-80 transition-opacity" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => navigate({ to: '/profile/$username', params: { username: post.author.username } })} className="font-bold text-sm hover:underline">{post.author.username}</button>
                {post.author.role !== 'user' && (
                  <Badge className="text-[10px] px-1.5 py-0"
                    style={{ background: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>
                    {post.author.role === 'moderator' ? 'Modo' : 'Admin'}
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">· {formatRelativeDate(post.created_at)}</span>
                {category && Icon && (
                  <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium', category.color)}>
                    <Icon className="h-2.5 w-2.5" />{category.name}
                  </div>
                )}
              </div>

              {(isAdminOrMod || isOwner) && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-8 z-50 w-52 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
                      >
                        {post.status !== 'approved' && (
                          <div className={cn('px-3 py-2 text-xs font-medium border-b border-border', STATUS_COLOR[post.status])}>
                            Statut : {STATUS_LABEL[post.status]}
                          </div>
                        )}
                        {isAdminOrMod && (
                          <>
                            {post.status !== 'approved' && (
                              <button onClick={() => statusMutation.mutate({ status: 'approved' })}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors text-green-600">
                                <CheckCircle className="h-4 w-4" /> Approuver
                              </button>
                            )}
                            {post.status !== 'flagged' && (
                              <button onClick={() => statusMutation.mutate({ status: 'flagged' })}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors text-orange-500">
                                <Flag className="h-4 w-4" /> Signaler
                              </button>
                            )}
                            {post.status !== 'blocked' && (
                              <button onClick={() => statusMutation.mutate({ status: 'blocked' })}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors text-red-500">
                                <XCircle className="h-4 w-4" /> Bloquer
                              </button>
                            )}
                            <button onClick={() => statusMutation.mutate({ status: post.status, is_hidden: !post.is_hidden })}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors text-muted-foreground border-t border-border">
                              {post.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              {post.is_hidden ? 'Rendre visible' : 'Masquer'}
                            </button>
                          </>
                        )}
                        {user && !isOwner && !isAdminOrMod && (
                          <button
                            onClick={() => { setMenuOpen(false); setShowReport(true) }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-orange-500/10 transition-colors text-orange-500 border-t border-border"
                          >
                            <Flag className="h-4 w-4" /> Signaler
                          </button>
                        )}
                        {(isOwner || isAdminOrMod) && (
                          <button
                            onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-destructive/10 transition-colors text-destructive border-t border-border"
                          >
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold mt-1 mb-2 leading-snug">{post.title}</h1>

            {/* Tags */}
            {tags.length > 0 && <TagList tags={tags} max={5} className="mb-3" />}

            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="flex items-center gap-1 -ml-2 border-t border-border/60 pt-3">
              <div className="flex items-center gap-1.5 p-2 rounded-full text-muted-foreground text-sm min-w-[36px]">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="tabular-nums">{totalCount}</span>
              </div>

              <button
                onClick={() => user && voteMutation.mutate(1)}
                disabled={!user}
                className={cn(
                  'flex items-center gap-1.5 p-2 rounded-full text-sm transition-colors duration-150 min-w-[36px]',
                  !user && 'opacity-40 cursor-not-allowed',
                  post.user_vote === 1
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10',
                )}
              >
                <ThumbsUp className="h-4 w-4 shrink-0" />
                <span className={cn('tabular-nums', post.user_vote === 1 && 'text-emerald-500')}>
                  {post.like_count ?? 0}
                </span>
              </button>

              <button
                onClick={() => user && voteMutation.mutate(-1)}
                disabled={!user}
                className={cn(
                  'flex items-center gap-1.5 p-2 rounded-full text-sm transition-colors duration-150 min-w-[36px]',
                  !user && 'opacity-40 cursor-not-allowed',
                  post.user_vote === -1
                    ? 'text-rose-500 bg-rose-500/10'
                    : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10',
                )}
              >
                <ThumbsDown className="h-4 w-4 shrink-0" />
                <span className={cn('tabular-nums', post.user_vote === -1 && 'text-rose-500')}>
                  {post.dislike_count ?? 0}
                </span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  toast.success('Lien copié !')
                }}
                className="p-2 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {isAdminOrMod && post.status !== 'approved' && (
                <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLOR[post.status])}>
                  <ShieldAlert className="inline h-3 w-3 mr-1" />{STATUS_LABEL[post.status]}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* ── En-tête section commentaires ── */}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        <h2 className="font-semibold text-sm">
          {totalCount} commentaire{totalCount > 1 ? 's' : ''}
        </h2>

        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Formulaire de commentaire principal */}
      {user && (
        <div className="mb-6">
          <CommentForm onSubmit={async (content) => { await commentMutation.mutateAsync(content) }} />
        </div>
      )}

      {/* ── Threads ── */}
      {commentsLoading ? (
        <div>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : commentTree.length > 0 ? (
        <AnimatePresence initial={false}>
          <div>
            {commentTree.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <CommentThread
                  comment={comment}
                  postId={postId}
                  isAdminOrMod={isAdminOrMod}
                  depth={0}
                  activeReplyId={activeReplyId}
                  onSetActiveReply={setActiveReplyId}
                  onReply={handleReply}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-10">
          Aucun commentaire. Sois le premier à répondre !
        </p>
      )}
    </div>
  )
}
