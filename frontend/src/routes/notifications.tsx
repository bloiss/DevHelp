import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Bell, MessageSquare, ArrowUp, Mail, Shield, CheckCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { AuthWall } from '@/components/shared/AuthWall'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatRelativeDate } from '@/lib/utils'
import { fadeInUp, stagger, staggerFast } from '@/lib/animations'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

type NotifType = 'comment' | 'like' | 'message' | 'report_update'

interface Notif {
  id: string
  type: NotifType
  read: boolean
  created_at: string
  actor: string
  post_title?: string
  post_category?: string
  post_id?: string
}

const MOCK: Notif[] = [
  {
    id: '1',
    type: 'comment',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: 'alex_dev',
    post_title: 'Pourquoi useEffect se déclenche deux fois en React 18 ?',
    post_category: 'react',
    post_id: '1',
  },
  {
    id: '2',
    type: 'like',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: 'marie_js',
    post_title: 'TanStack Query vs SWR en 2025 — lequel choisir ?',
    post_category: 'react',
    post_id: '2',
  },
  {
    id: '3',
    type: 'message',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actor: 'thomas_w',
  },
  {
    id: '4',
    type: 'report_update',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actor: 'system',
    post_title: "Comment structurer les dossiers d'un projet React en équipe ?",
    post_category: 'react',
    post_id: '3',
  },
  {
    id: '5',
    type: 'comment',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    actor: 'camille_r',
    post_title: 'Zustand ou Redux Toolkit pour une appli de taille moyenne ?',
    post_category: 'react',
    post_id: '4',
  },
]

const TYPE_CONFIG = {
  comment: {
    Icon: MessageSquare,
    color: 'bg-blue-500/10 text-blue-500',
    text: (n: Notif) => (
      <>
        <span className="font-medium text-foreground">{n.actor}</span>
        {' a commenté ton post '}
        <span className="font-medium text-foreground line-clamp-1">"{n.post_title}"</span>
      </>
    ),
  },
  like: {
    Icon: ArrowUp,
    color: 'bg-amber-500/10 text-amber-500',
    text: (n: Notif) => (
      <>
        <span className="font-medium text-foreground">{n.actor}</span>
        {' a voté pour ton post '}
        <span className="font-medium text-foreground">"{n.post_title}"</span>
      </>
    ),
  },
  message: {
    Icon: Mail,
    color: 'bg-violet-500/10 text-violet-500',
    text: (n: Notif) => (
      <>
        {'Nouveau message de '}
        <span className="font-medium text-foreground">{n.actor}</span>
      </>
    ),
  },
  report_update: {
    Icon: Shield,
    color: 'bg-green-500/10 text-green-500',
    text: (n: Notif) => (
      <>
        {'Ton post '}
        <span className="font-medium text-foreground">"{n.post_title}"</span>
        {' a été approuvé par la modération'}
      </>
    ),
  },
} satisfies Record<NotifType, { Icon: React.ElementType; color: string; text: (n: Notif) => React.ReactNode }>

function NotificationsPage() {
  const { isAuthenticated } = useAuthStore()
  const [notifs, setNotifs] = useState<Notif[]>(MOCK)

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<Bell className="h-8 w-8" />}
        title="Suis tes notifications"
        description="Connecte-toi pour voir les réponses à tes posts, les votes reçus, les mentions et toute l'activité autour de tes contributions."
      />
    )
  }

  const unreadCount = notifs.filter((n) => !n.read).length

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
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
      {notifs.length === 0 ? (
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
          {notifs.map((notif) => {
            const { Icon, color, text } = TYPE_CONFIG[notif.type]
            const rowClass = cn(
              'flex items-start gap-4 px-4 py-4 hover:bg-accent/50 transition-colors',
              !notif.read && 'bg-primary/5',
            )
            const rowContent = (
              <>
                <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground leading-snug">{text(notif)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(notif.created_at)}</p>
                </div>
                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
              </>
            )
            return (
              <motion.div key={notif.id} variants={fadeInUp}>
              {notif.type === 'message' ? (
                <Link to="/messages" onClick={() => markRead(notif.id)} className={rowClass}>
                  {rowContent}
                </Link>
              ) : (
                <Link
                  to="/forum/$category/$postId"
                  params={{ category: notif.post_category!, postId: notif.post_id! }}
                  onClick={() => markRead(notif.id)}
                  className={rowClass}
                >
                  {rowContent}
                </Link>
              )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
