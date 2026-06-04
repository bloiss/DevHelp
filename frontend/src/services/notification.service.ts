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
  type: string // "comment" | "like"
  payload: NotifPayload
  read: boolean
  created_at: string
}

export const notificationService = {
  list: () =>
    api.get<ApiNotification[]>('/notifications').then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),
}
