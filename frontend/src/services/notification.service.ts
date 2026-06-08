import { api } from '@/lib/api'

export interface NotifPayload {
  actor: string
  post_id?: string
  post_title?: string
  post_category?: string
  comment_id?: string
  conv_id?: string
}

export interface ApiNotification {
  id: string
  type: string
  payload: NotifPayload
  read: boolean
  is_starred: boolean
  is_archived: boolean
  created_at: string
}

export interface NotificationPrefs {
  user_id: string
  push_enabled: boolean
  notify_on_comment: boolean
  notify_on_like: boolean
  notify_on_message: boolean
}

export const notificationService = {
  list: () =>
    api.get<ApiNotification[]>('/notifications').then((r) => r.data),

  listInbox: () =>
    api.get<ApiNotification[]>('/notifications/inbox').then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  markUnread: (id: string) =>
    api.patch(`/notifications/${id}/unread`),

  star: (id: string, starred: boolean) =>
    api.patch(`/notifications/${id}/star`, { starred }),

  archive: (id: string, archived: boolean) =>
    api.patch(`/notifications/${id}/archive`, { archived }),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  // ─── Préférences ────────────────────────────────────────────────
  getPrefs: () =>
    api.get<NotificationPrefs>('/notifications/prefs').then((r) => r.data),

  updatePrefs: (prefs: Partial<Omit<NotificationPrefs, 'user_id'>>) =>
    api.patch<NotificationPrefs>('/notifications/prefs', prefs).then((r) => r.data),

  // ─── Push subscriptions ─────────────────────────────────────────
  getVapidKey: () =>
    api.get<{ public_key: string }>('/push/vapid-key').then((r) => r.data.public_key),

  savePushSub: (endpoint: string, p256dh: string, auth: string) =>
    api.post('/push/subscriptions', { endpoint, p256dh, auth }),

  deletePushSub: (endpoint: string) =>
    api.delete('/push/subscriptions', { data: { endpoint } }),
}
