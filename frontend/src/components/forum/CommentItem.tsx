import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, MoreHorizontal, CornerDownRight, Reply, Flag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { VoteButtons } from './VoteButtons'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ReportDialog } from '@/components/shared/ReportDialog'
import { formatRelativeDate, cn } from '@/lib/utils'
import { postService } from '@/services/post.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { Comment } from '@/types/post'

interface CommentItemProps {
  comment: Comment
  postId: string
  isAdminOrMod?: boolean
  depth?: number
  replyingToUsername?: string
  repliesCount?: number
  isReplying?: boolean
  onReplyClick?: () => void
}

export function CommentItem({
  comment,
  postId,
  isAdminOrMod = false,
  depth = 0,
  replyingToUsername,
  repliesCount = 0,
  isReplying = false,
  onReplyClick,
}: CommentItemProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showReport,  setShowReport]  = useState(false)
  const isOwner = user?.id === comment.user_id
  const canModerate = isAdminOrMod || isOwner
  const canReport = !!user && !isOwner && !isAdminOrMod
  const isReply = depth > 0

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postService.voteComment(postId, comment.id, value),
    onSuccess: (response) => {
      queryClient.setQueryData(['comments', postId], (old: any[]) =>
        (old ?? []).map((c: any) =>
          c.id === comment.id
            ? { ...c, like_count: response.data.like_count, dislike_count: response.data.dislike_count, user_vote: response.data.user_vote }
            : c
        )
      )
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de voter.' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => postService.deleteComment(postId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      toast.success('Commentaire supprimé')
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de supprimer.' }),
  })

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce commentaire ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => { setConfirmOpen(false); deleteMutation.mutate() }}
        onCancel={() => setConfirmOpen(false)}
      />
      {showReport && (
        <ReportDialog
          postId={postId}
          commentId={comment.id}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="flex gap-2.5">

        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <Link to="/profile/$username" params={{ username: comment.author.username }}>
            <Avatar
              user={comment.author}
              size={isReply ? 'sm' : 'md'}
              className={cn(
                'rounded-full hover:opacity-80 transition-opacity',
                isReply ? 'h-7 w-7' : 'h-9 w-9',
              )}
            />
          </Link>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">

          {/* Contexte "En réponse à" (sous-réponse à une réponse) */}
          {replyingToUsername && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
              <CornerDownRight className="h-3 w-3 shrink-0" />
              <span>répond à</span>
              <span className="font-semibold" style={{ color: 'var(--gold)' }}>
                @{replyingToUsername}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to="/profile/$username" params={{ username: comment.author.username }} className="font-bold text-sm hover:underline">{comment.author.username}</Link>
              {comment.author.role !== 'user' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {comment.author.role === 'moderator' ? 'Modo' : 'Admin'}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                · {formatRelativeDate(comment.created_at)}
              </span>
            </div>

            {/* Menu actions */}
            {(canModerate || canReport) && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
                    >
                      {canReport && (
                        <button
                          onClick={() => { setMenuOpen(false); setShowReport(true) }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-orange-500 hover:bg-orange-500/10 transition-colors"
                        >
                          <Flag className="h-4 w-4" /> Signaler
                        </button>
                      )}
                      {canModerate && (
                        <button
                          onClick={() => { setMenuOpen(false); setConfirmOpen(true) }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

          {/* Contenu */}
          <p className="text-sm leading-relaxed text-foreground mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions : votes + répondre */}
          <div className="flex items-center gap-3 mt-2 -ml-1.5">
            <VoteButtons
              likeCount={comment.like_count ?? 0}
              dislikeCount={comment.dislike_count ?? 0}
              userVote={comment.user_vote ?? null}
              onVote={user ? (value) => voteMutation.mutate(value) : undefined}
              orientation="horizontal"
            />

            {user && onReplyClick && (
              <button
                onClick={onReplyClick}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                  isReplying
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Reply className="h-3.5 w-3.5" />
                {isReplying ? 'Annuler' : 'Répondre'}
                {repliesCount > 0 && !isReplying && (
                  <span className="ml-0.5 tabular-nums">· {repliesCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
