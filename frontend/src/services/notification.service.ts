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
}
