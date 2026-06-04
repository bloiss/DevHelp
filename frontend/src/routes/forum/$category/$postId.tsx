import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare, ThumbsUp, ThumbsDown, Share2,
  Trash2, EyeOff, Eye, ShieldAlert, MoreHorizontal, CheckCircle, XCircle, Flag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BackButton }      from '@/components/shared/BackButton'
import { CommentItem }     from '@/components/forum/CommentItem'
import { CommentForm }     from '@/components/forum/CommentForm'
import { Avatar }          from '@/components/shared/Avatar'
import { Badge }           from '@/components/ui/badge'
import { ConfirmDialog }   from '@/components/shared/ConfirmDialog'
import { getCategoryBySlug } from '@/data/categories'
import { postService }     from '@/services/post.service'
import { adminService }    from '@/services/admin.service'
import { useAuthStore }    from '@/stores/authStore'
import { toast }           from '@/stores/toastStore'
import { formatRelativeDate, cn } from '@/lib/utils'

export const Route = createFileRoute('/forum/$category/$postId')({
  component: PostPage,
})

function PostPage() {
  const { category: slug, postId } = Route.useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isAdminOrMod = user?.role === 'admin' || user?.role === 'moderator'

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.get(postId),
  })

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!post,
  })

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postService.vote(postId, value),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => postService.createComment(postId, content).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

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

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="h-5 w-28 bg-muted animate-pulse rounded mb-6" />
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${90 - i * 8}%` }} />)}
        </div>
      </div>
    </div>
  )

  if (isError || !post) throw notFound()

  const category = getCategoryBySlug(slug)
  const Icon = category?.icon
  const isOwner = user?.id === post.user_id

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

      <BackButton label={category ? `Retour à ${category.name}` : 'Retour'} className="mb-4" />

      {/* ── Post — layout Twitter ── */}
      <article className="border-b border-border pb-4">
        <div className="flex gap-3">

          {/* Avatar gauche */}
          <div className="shrink-0">
            <Avatar user={post.author} size="md" className="h-10 w-10 rounded-full" />
          </div>

          {/* Contenu droite */}
          <div className="flex-1 min-w-0">

            {/* Header : username · date · badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm">{post.author.username}</span>
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

              {/* Menu modération (admin/modo/owner) */}
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
                        {/* Status badge */}
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

            {/* Titre */}
            <h1 className="text-xl font-bold mt-1 mb-3 leading-snug">{post.title}</h1>

            {/* Contenu HTML */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Barre d'actions */}
            <div className="flex items-center gap-1 -ml-2 border-t border-border/60 pt-3">

              {/* Commentaires */}
              <div className="flex items-center gap-1.5 p-2 rounded-full text-muted-foreground text-sm">
                <MessageSquare className="h-4.5 w-4.5" />
                <span>{comments.length}</span>
              </div>

              {/* Vote up */}
              <button
                onClick={() => user && voteMutation.mutate(1)}
                disabled={!user}
                className={cn(
                  'flex items-center gap-1.5 p-2 rounded-full text-sm transition-colors duration-150',
                  !user && 'opacity-40 cursor-not-allowed',
                  post.user_vote === 1
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10',
                )}
              >
                <ThumbsUp className="h-4.5 w-4.5" />
                <span className={cn('tabular-nums', post.user_vote === 1 && 'text-emerald-500')}>
                  {post.vote_count ?? 0}
                </span>
              </button>

              {/* Vote down */}
              <button
                onClick={() => user && voteMutation.mutate(-1)}
                disabled={!user}
                className={cn(
                  'p-2 rounded-full text-sm transition-colors duration-150',
                  !user && 'opacity-40 cursor-not-allowed',
                  post.user_vote === -1
                    ? 'text-rose-500 bg-rose-500/10'
                    : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10',
                )}
              >
                <ThumbsDown className="h-4.5 w-4.5" />
              </button>

              {/* Partager */}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  toast.success('Lien copié !')
                }}
                className="p-2 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>

              {/* Badge statut pour admin */}
              {isAdminOrMod && post.status !== 'approved' && (
                <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLOR[post.status])}>
                  <ShieldAlert className="inline h-3 w-3 mr-1" />{STATUS_LABEL[post.status]}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* ── Commentaires ── */}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">
          {comments.length} commentaire{comments.length > 1 ? 's' : ''}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {user && (
        <div className="mb-6">
          <CommentForm onSubmit={(content) => commentMutation.mutateAsync(content)} />
        </div>
      )}

      {commentsLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} isAdminOrMod={isAdminOrMod} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-10">
          Aucun commentaire. Sois le premier à répondre !
        </p>
      )}
    </div>
  )
}
