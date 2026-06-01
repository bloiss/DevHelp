import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { VoteButtons } from './VoteButtons'
import { formatRelativeDate } from '@/lib/utils'
import { postService } from '@/services/post.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { Comment } from '@/types/post'

interface CommentItemProps {
  comment: Comment
  postId: string
  isAdminOrMod?: boolean
}

export function CommentItem({ comment, postId, isAdminOrMod = false }: CommentItemProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = user?.id === comment.user_id
  const canModerate = isAdminOrMod || isOwner

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postService.voteComment(postId, comment.id, value),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
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
    <div className="flex gap-3 py-4">

      {/* Avatar gauche */}
      <div className="shrink-0">
        <Avatar user={comment.author} size="md" className="h-10 w-10 rounded-full" />
      </div>

      {/* Contenu droite */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm">{comment.author.username}</span>
            {comment.author.role !== 'user' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {comment.author.role === 'moderator' ? 'Modo' : 'Admin'}
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">· {formatRelativeDate(comment.created_at)}</span>
          </div>

          {/* Menu */}
          {canModerate && (
            <div className="relative">
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
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce commentaire ?')) deleteMutation.mutate()
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Contenu */}
        <p className="text-sm leading-relaxed text-foreground mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Votes */}
        <div className="mt-2 -ml-1.5">
          <VoteButtons
            score={comment.vote_count ?? 0}
            userVote={comment.user_vote ?? null}
            onVote={user ? (value) => voteMutation.mutate(value) : undefined}
            orientation="horizontal"
          />
        </div>
      </div>
    </div>
  )
}
