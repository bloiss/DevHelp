import { create } from 'zustand'

interface Notification {
  id: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Notification) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}))
