import { api } from '@/lib/api'
import type { User } from '@/types/user'

export interface MessageRead {
  message_id: string
  user_id:    string
  read_at:    string
}

export interface SharedPost {
  id:       string
  title:    string
  content:  string
  category: { slug: string; name: string }
  author:   User
}

export interface ApiMessage {
  id:              string
  conversation_id: string
  sender_id:       string
  content:         string
  status:          'sent' | 'delivered' | 'read'
  attachment_url?:  string
  attachment_type?: 'image' | 'gif'
  shared_post_id?:  string
  is_deleted:       boolean
  created_at:       string
  sender:           User
  shared_post?:     SharedPost
  reads:            MessageRead[]
}

export interface ApiConversation {
  id:                string
  status:            'active' | 'request'
  request_sender_id?: string
  created_at:        string
  participants:      User[]
  other_user:        User
  last_message:      ApiMessage | null
  unread_count:      number
}

export interface MessagesPage {
  data:     ApiMessage[]
  has_more: boolean
}

export const messageService = {
  listConversations: () =>
    api.get<{ data: ApiConversation[] }>('/conversations').then((r) => r.data.data),

  openConversation: (userId: string) =>
    api.post<ApiConversation>('/conversations', { user_id: userId }).then((r) => r.data),

  getMessages: (convId: string, before?: string): Promise<MessagesPage> =>
    api
      .get<{ data: ApiMessage[]; has_more: boolean }>(`/conversations/${convId}/messages`, {
        params: before ? { before } : {},
      })
      .then((r) => ({ data: r.data.data, has_more: r.data.has_more })),

  sendMessage: (
    convId:         string,
    content:        string,
    attachmentURL?: string,
    attachmentType?: 'image' | 'gif',
    sharedPostId?:  string,
  ) =>
    api
      .post<ApiMessage>(`/conversations/${convId}/messages`, {
        content,
        attachment_url:  attachmentURL,
        attachment_type: attachmentType,
        shared_post_id:  sharedPostId,
      })
      .then((r) => r.data),

  acceptConversation: (convId: string) =>
    api.post(`/conversations/${convId}/accept`).then((r) => r.data),

  markRead: (convId: string) =>
    api.post(`/conversations/${convId}/read`).then((r) => r.data),

  getPresence: (convId: string) =>
    api.get<{ data: Array<{ user_id: string; is_online: boolean; last_seen?: string }> }>(
      `/conversations/${convId}/presence`,
    ).then((r) => r.data.data),
}
