import { api } from '@/lib/api'
import type { User } from '@/types/user'

export interface Report {
  id:              string
  reporter_id:     string
  target_id:       string
  target_type:     'post' | 'comment' | 'user'
  reason:          string
  status:          'pending' | 'resolved' | 'dismissed'
  resolved_by?:    string
  created_at:      string
  resolved_at?:    string
  reporter:        User
  target_title?:   string
  target_content?: string
}

export interface ReportListResult {
  data:     Report[]
  total:    number
  page:     number
  per_page: number
}

export const reportService = {
  reportPost: (postId: string, reason: string) =>
    api.post(`/posts/${postId}/report`, { reason }).then((r) => r.data),

  reportComment: (postId: string, commentId: string, reason: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/report`, { reason }).then((r) => r.data),
}
