import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CommentItem } from './CommentItem'
import { ReplyForm } from './ReplyForm'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types/post'

interface CommentThreadProps {
  comment: Comment
  postId: string
  isAdminOrMod: boolean
  depth?: number
  activeReplyId: string | null
  onSetActiveReply: (id: string | null) => void
  onReply: (parentId: string, parentAuthorUsername: string, content: string) => Promise<void>
  parentAuthorUsername?: string
}

const MAX_VISUAL_DEPTH = 2

export function CommentThread({
  comment,
  postId,
  isAdminOrMod,
  depth = 0,
  activeReplyId,
  onSetActiveReply,
  onReply,
  parentAuthorUsername,
}: CommentThreadProps) {
  const replies = comment.replies ?? []
  const [showReplies, setShowReplies] = useState(true)
  const isReplying = activeReplyId === comment.id
  const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH)

  function handleReplyClick() {
    onSetActiveReply(isReplying ? null : comment.id)
  }

  async function handleReplySubmit(content: string) {
    await onReply(comment.id, comment.author.username, content)
    onSetActiveReply(null)
  }

  return (
    <div className={cn('py-3', depth === 0 && 'border-b border-border last:border-b-0')}>

      {/* Commentaire courant */}
      <CommentItem
        comment={comment}
        postId={postId}
        isAdminOrMod={isAdminOrMod}
        depth={visualDepth}
        replyingToUsername={depth > 0 ? parentAuthorUsername : undefined}
        repliesCount={replies.length}
        isReplying={isReplying}
        onReplyClick={handleReplyClick}
      />

      {/* Formulaire de réponse inline */}
      <AnimatePresence>
        {isReplying && (
          <div className={cn(depth === 0 ? 'ml-11' : 'ml-9')}>
            <ReplyForm
              replyingToUsername={comment.author.username}
              onSubmit={handleReplySubmit}
              onCancel={() => onSetActiveReply(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Section des réponses */}
      {replies.length > 0 && (
        <div className={cn(depth === 0 ? 'ml-11 mt-1' : 'ml-9 mt-1')}>

          {/* Bouton toggle "Voir / Masquer les réponses" */}
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 group"
          >
            <span
              className="flex h-px flex-1 max-w-[20px] transition-colors"
              style={{ background: 'var(--gold-border)' }}
            />
            {showReplies ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Masquer les réponses
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Voir {replies.length} réponse{replies.length > 1 ? 's' : ''}
              </>
            )}
          </button>

          {/* Liste des réponses avec ligne verticale */}
          <AnimatePresence initial={false}>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="border-l-2 border-border/50 hover:border-border/80 transition-colors pl-3 mt-1">
                  {replies.map((reply, i) => (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                    >
                      <CommentThread
                        comment={reply}
                        postId={postId}
                        isAdminOrMod={isAdminOrMod}
                        depth={depth + 1}
                        activeReplyId={activeReplyId}
                        onSetActiveReply={onSetActiveReply}
                        onReply={onReply}
                        parentAuthorUsername={comment.author.username}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
