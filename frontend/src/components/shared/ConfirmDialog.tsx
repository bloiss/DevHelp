import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6"
            >
              {/* Icon + title */}
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${
                    variant === 'destructive' ? 'text-destructive' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">{title}</h2>
                  {description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={onCancel}
                >
                  Annuler
                </Button>
                <Button
                  variant={variant === 'destructive' ? 'destructive' : 'default'}
                  className="flex-1 rounded-full"
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
