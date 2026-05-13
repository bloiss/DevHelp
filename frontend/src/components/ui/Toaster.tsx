import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

// ─── Config per type ─────────────────────────────────────────────────────────

const CONFIG = {
  success: {
    Icon:        CheckCircle,
    iconClass:   'text-emerald-500',
    barClass:    'bg-emerald-500',
    wrapClass:   'bg-emerald-500/10 border-emerald-500/20',
  },
  error: {
    Icon:        XCircle,
    iconClass:   'text-destructive',
    barClass:    'bg-destructive',
    wrapClass:   'bg-destructive/10 border-destructive/20',
  },
  info: {
    Icon:        Info,
    iconClass:   'text-gold',
    barClass:    'bg-gold',
    wrapClass:   'bg-gold/10 border-gold/20',
  },
  warning: {
    Icon:        AlertTriangle,
    iconClass:   'text-gold',
    barClass:    'bg-gold',
    wrapClass:   'bg-gold/10 border-gold/20',
  },
} as const

// ─── Single toast item ───────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore(s => s.remove)
  const { Icon, iconClass, barClass, wrapClass } = CONFIG[toast.type]

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => remove(toast.id), toast.duration)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, remove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.94 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 64, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
      className={cn(
        'relative w-80 overflow-hidden rounded-xl border shadow-lg',
        'bg-card/95 backdrop-blur-sm',
        wrapClass,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <Icon className={cn('h-4.5 w-4.5 shrink-0 mt-0.5', iconClass)} style={{ width: 18, height: 18 }} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => remove(toast.id)}
          className="shrink-0 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={cn('absolute bottom-0 left-0 right-0 h-[2px] origin-left', barClass)}
        style={{ animation: `progress-shrink ${toast.duration}ms linear forwards` }}
      />
    </motion.div>
  )
}

// ─── Toast container ─────────────────────────────────────────────────────────

export function Toaster() {
  const toasts = useToastStore(s => s.toasts)

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none"
    >
      <AnimatePresence mode="sync" initial={false}>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
