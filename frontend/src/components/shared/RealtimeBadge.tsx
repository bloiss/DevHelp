import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { WsStatus } from '@/hooks/useWebSocket'

interface RealtimeBadgeProps {
  status: WsStatus
  className?: string
}

export function RealtimeBadge({ status, className }: RealtimeBadgeProps) {
  return (
    <AnimatePresence>
      {status === 'connected' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            className,
          )}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          En direct
        </motion.div>
      )}
    </AnimatePresence>
  )
}
