import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, MessageSquare, ThumbsUp, AtSign, CheckCircle2, PenSquare, CheckCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { AuthWall } from '@/components/shared/AuthWall'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore, type Notification, type NotifKind } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'
import { fadeInUp, stagger, staggerFast } from '@/lib/animations'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'À l\'instant'
  if (m < 60)  return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

const KIND_CONFIG: Record<NotifKind, {
  Icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  comment:  { Icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500' },
  reply:    { Icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500' },
  like:     { Icon: ThumbsUp,      color: 'bg-amber-500/10 text-amber-500' },
  vote:     { Icon: ThumbsUp,      color: 'bg-amber-500/10 text-amber-500' },
  mention:  { Icon: AtSign,        color: 'bg-violet-500/10 text-violet-500' },
  resolved: { Icon: CheckCircle2,  color: 'bg-emerald-500/10 text-emerald-500' },
  new_post: { Icon: PenSquare,     color: 'bg-primary/10 text-primary' },
}

function NotifRow({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const { Icon, color } = KIND_CONFIG[notif.kind]

  const inner = (
    <div
      className={cn(
        'flex items-start gap-4 px-4 py-4 hover:bg-accent/50 transition-colors cursor-pointer',
        !notif.read && 'bg-primary/[0.03]',
      )}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', notif.read ? 'text-muted-foreground' : 'text-foreground font-medium')}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">{relativeTime(notif.created_at)}</p>
      </div>
      {!notif.read && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  )

  if (notif.href) {
    return (
      <Link to={notif.href as never} onClick={() => onRead(notif.id)}>
        {inner}
      </Link>
    )
  }

  return inner
}

function NotificationsPage() {
  const { isAuthenticated } = useAuthStore()
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    fetchNotifications,
  } = useNotificationStore()

  useEffect(() => {
    if (isAuthenticated) fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<Bell className="h-8 w-8" />}
        title="Suis tes notifications"
        description="Connecte-toi pour voir les réponses à tes posts, les votes reçus, les mentions et toute l'activité autour de tes contributions."
      />
    )
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </motion.div>

      {/* Liste */}
      {notifications.length === 0 ? (
        <motion.div variants={fadeInUp}>
          <EmptyState
            icon={<Bell className="h-10 w-10" />}
            title="Aucune notification"
            description="Tu seras notifié ici lorsque quelqu'un interagit avec tes posts."
          />
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden"
          variants={staggerFast}
          initial="hidden"
          animate="visible"
        >
          {notifications.map((notif) => (
            <motion.div key={notif.id} variants={fadeInUp}>
              <NotifRow notif={notif} onRead={markRead} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
