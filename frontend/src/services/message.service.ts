import { api } from '@/lib/api'
import type { User } from '@/types/user'

export interface ApiMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  sender: User
}

export interface ApiConversation {
  id: string
  status: 'active' | 'request'
  request_sender_id?: string
  created_at: string
  participants: User[]
  other_user: User
  last_message: ApiMessage | null
  unread_count: number
}

export const messageService = {
  listConversations: () =>
    api.get<{ data: ApiConversation[] }>('/conversations').then((r) => r.data.data),

  openConversation: (userId: string) =>
    api.post<ApiConversation>('/conversations', { user_id: userId }).then((r) => r.data),

  getMessages: (convId: string, page = 1) =>
    api.get<{ data: ApiMessage[] }>(`/conversations/${convId}/messages`, { params: { page } })
      .then((r) => r.data.data),

  sendMessage: (convId: string, content: string) =>
    api.post<ApiMessage>(`/conversations/${convId}/messages`, { content }).then((r) => r.data),

  acceptConversation: (convId: string) =>
    api.post(`/conversations/${convId}/accept`).then((r) => r.data),
}
