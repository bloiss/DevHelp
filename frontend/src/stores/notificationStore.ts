import { create } from 'zustand'
import { notificationService, type ApiNotification } from '@/services/notification.service'

export type NotifKind = 'comment' | 'like' | 'reply' | 'vote' | 'mention' | 'resolved' | 'new_post'

export interface Notification {
  id: string
  kind: NotifKind
  title: string
  body: string
  fromUser?: string
  href?: string
  read: boolean
  created_at: string
}

function mapApiNotif(n: ApiNotification): Notification {
  const p = n.payload
  const href = p.post_category && p.post_id
    ? `/forum/${p.post_category}/${p.post_id}`
    : undefined

  if (n.type === 'comment') {
    return {
      id: n.id,
      kind: 'reply',
      title: `${p.actor} a commenté ton post`,
      body: p.post_title ? `"${p.post_title}"` : '',
      fromUser: p.actor,
      href,
      read: n.read,
      created_at: n.created_at,
    }
  }
  if (n.type === 'like') {
    return {
      id: n.id,
      kind: 'vote',
      title: `${p.actor} a aimé ton post`,
      body: p.post_title ? `"${p.post_title}"` : '',
      fromUser: p.actor,
      href,
      read: n.read,
      created_at: n.created_at,
    }
  }
  return {
    id: n.id,
    kind: 'mention',
    title: n.type,
    body: '',
    read: n.read,
    created_at: n.created_at,
  }
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  open:   () => void
  close:  () => void
  toggle: () => void
  fetchNotifications: () => Promise<void>
  fetchUnreadCount:   () => Promise<void>
  markAllRead: () => Promise<void>
  markRead:    (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  fetchNotifications: async () => {
    try {
      const data = await notificationService.list()
      const notifications = data.map(mapApiNotif)
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length })
    } catch {
      // not authenticated yet — silently ignore
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.unreadCount()
      set({ unreadCount: count })
    } catch {
      // not authenticated yet — silently ignore
    }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch { /* ignore */ }
  },

  markRead: async (id: string) => {
    try {
      await notificationService.markRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(
          0,
          state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0),
        ),
      }))
    } catch { /* ignore */ }
  },
}))
