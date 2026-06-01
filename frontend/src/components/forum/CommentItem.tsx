import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { VoteButtons } from './VoteButtons'
import { formatRelativeDate } from '@/lib/utils'
import { postService } from '@/services/post.service'
import { useAuthStore } from '@/stores/authStore'
import type { Comment } from '@/types/post'

interface CommentItemProps {
  comment: Comment
  postId: string
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) =>
      postService.voteComment(postId, comment.id, value),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  })

  return (
    <div className="flex gap-4 py-4">

      {/* Vote */}
      <VoteButtons
        score={comment.vote_count ?? 0}
        userVote={comment.user_vote ?? null}
        onVote={user ? (value) => voteMutation.mutate(value) : undefined}
        orientation="vertical"
      />

      {/* Contenu */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar user={comment.author} size="sm" />
          <span className="font-medium text-foreground">{comment.author.username}</span>
          {comment.author.role !== 'user' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {comment.author.role === 'moderator' ? 'Modo' : 'Admin'}
            </Badge>
          )}
          <span>·</span>
          <span>{formatRelativeDate(comment.created_at)}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
