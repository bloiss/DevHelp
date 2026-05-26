import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/authStore'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Connecte-toi pour laisser un commentaire.
        </p>
        <Link to="/auth/login">
          <Button variant="outline" size="sm">Se connecter</Button>
        </Link>
      </div>
    )
  }

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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar user={user} size="md" className="shrink-0 mt-1" />
      <div className="flex flex-col gap-2 flex-1">
        <Textarea
          placeholder="Écris ton commentaire…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={loading}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Commenter
          </Button>
        </div>
      </div>
    </form>
  )
}
