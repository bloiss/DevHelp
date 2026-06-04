import { useState } from 'react'
import { Loader2, X, CornerDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/authStore'

interface ReplyFormProps {
  replyingToUsername: string
  onSubmit: (content: string) => Promise<void>
  onCancel: () => void
}

export function ReplyForm({ replyingToUsername, onSubmit, onCancel }: ReplyFormProps) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex gap-2.5 pt-3 pb-1">
        <Avatar user={user} size="sm" className="shrink-0 mt-0.5" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Context "En réponse à" */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span>En réponse à</span>
            <span
              className="font-semibold"
              style={{ color: 'var(--gold)' }}
            >
              @{replyingToUsername}
            </span>
          </div>

          <Textarea
            placeholder={`Réponds à @${replyingToUsername}…`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            disabled={loading}
            autoFocus
            className="text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel()
            }}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !content.trim()}
              className="h-7 text-xs"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Répondre
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
