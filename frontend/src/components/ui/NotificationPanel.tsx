import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ThumbsUp, AtSign, CheckCircle2, PenSquare,
  BellOff, CheckCheck, ArrowRight,
} from 'lucide-react'
import { useNotificationStore, type Notification, type NotifKind } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'

// ─── Icon + style per kind ────────────────────────────────────────────────────

const KIND_CONFIG: Record<NotifKind, {
  Icon: React.ComponentType<{ className?: string }>
  iconClass: string
  bgClass: string
}> = {
  reply:    { Icon: MessageSquare, iconClass: 'text-blue-500',    bgClass: 'bg-blue-500/10'    },
  vote:     { Icon: ThumbsUp,      iconClass: 'text-gold',        bgClass: 'bg-gold/10'        },
  mention:  { Icon: AtSign,        iconClass: 'text-violet-500',  bgClass: 'bg-violet-500/10'  },
  resolved: { Icon: CheckCircle2,  iconClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  new_post: { Icon: PenSquare,     iconClass: 'text-gold-muted',  bgClass: 'bg-gold/8'         },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'À l\'instant'
  if (m < 60)  return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({ notif }: { notif: Notification }) {
  const markRead = useNotificationStore((s) => s.markRead)
  const close    = useNotificationStore((s) => s.close)
  const cfg = KIND_CONFIG[notif.kind]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 cursor-pointer group',
        'hover:bg-muted/60 transition-colors duration-150',
        !notif.read && 'bg-gold/[0.04]',
      )}
      onClick={() => {
        markRead(notif.id)
        close()
      }}
    >
      {/* Unread indicator */}
      {!notif.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
      )}

      {/* Kind icon */}
      <div className={cn('mt-0.5 rounded-lg p-1.5 shrink-0', cfg.bgClass)}>
        <cfg.Icon className={cn('h-3.5 w-3.5', cfg.iconClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          notif.read ? 'text-muted-foreground' : 'text-foreground font-medium',
        )}>
          {notif.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{relativeTime(notif.created_at)}</p>
      </div>

      {/* Arrow on hover */}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-1 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors duration-150" />
    </motion.div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const { notifications, unreadCount, isOpen, close, markAllRead } = useNotificationStore()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className={cn(
            'absolute right-0 top-[calc(100%+8px)] z-50 w-[360px]',
            'rounded-xl border border-border bg-popover/95 backdrop-blur-xl',
            'shadow-[0_16px_48px_hsl(0_0%_0%/0.12)] dark:shadow-[0_16px_64px_hsl(0_0%_0%/0.5)]',
            'overflow-hidden',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full text-[10px] font-bold bg-gold text-primary-foreground leading-none" style={{ height: 18 }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {notifications.map((n) => (
                  <NotifRow key={n.id} notif={n} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <Link
              to="/forum"
              onClick={close}
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Voir toutes les notifications
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
