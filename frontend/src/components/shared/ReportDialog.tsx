import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Flag, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { reportService } from '@/services/report.service'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const REASONS = [
  { value: 'spam',           label: 'Spam' },
  { value: 'inappropriate',  label: 'Contenu inapproprié' },
  { value: 'harassment',     label: 'Harcèlement' },
  { value: 'misinformation', label: 'Désinformation' },
  { value: 'other',          label: 'Autre' },
]

interface ReportDialogProps {
  postId:     string
  commentId?: string
  onClose:    () => void
}

export function ReportDialog({ postId, commentId, onClose }: ReportDialogProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [details,  setDetails]  = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const reason = selected === 'other' && details.trim()
        ? details.trim()
        : (REASONS.find((r) => r.value === selected)?.label ?? selected!)
      return commentId
        ? reportService.reportComment(postId, commentId, reason)
        : reportService.reportPost(postId, reason)
    },
    onSuccess: () => {
      toast.success('Signalement envoyé', { description: 'Les modérateurs vont examiner ce contenu.' })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Impossible d\'envoyer le signalement.'
      toast.error('Erreur', { description: msg })
    },
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold text-sm">
                Signaler {commentId ? 'ce commentaire' : 'ce post'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Pourquoi signales-tu ce contenu ?
            </p>

            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl text-sm border transition-all',
                    selected === r.value
                      ? 'border-orange-400 bg-orange-500/10 text-foreground font-medium'
                      : 'border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {selected === 'other' && (
              <textarea
                autoFocus
                placeholder="Décris le problème…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-sm bg-muted rounded-xl border border-border outline-none focus:border-ring resize-none placeholder:text-muted-foreground"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={!selected || (selected === 'other' && !details.trim()) || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-1.5"
            >
              {mutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Flag className="h-3.5 w-3.5" />
              }
              Envoyer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
