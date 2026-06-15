import { api } from '@/lib/api'
import type { User } from '@/types/user'
import type { Post, Comment } from '@/types/post'
import type { PaginatedResponse } from '@/types/api'
import type { Report, ReportListResult } from '@/services/report.service'

export type { Report }

export interface ModerationLog {
  id: string
  target_id: string
  target_type: 'post' | 'comment'
  ai_verdict: string
  ai_reason: string
  ai_confidence: number | null
  ai_categories: string | null
  ai_provider: string | null
  reviewed_by: string | null
  final_status: string | null
  created_at: string
  reviewed_at: string | null
}

export interface ModerationItem {
  type: 'post' | 'comment'
  post?: Post
  comment?: Comment
  log?: ModerationLog
}

export interface ModerationListResult {
  items: ModerationItem[]
  total_posts: number
  total_comments: number
  page: number
  per_page: number
}

export interface ModerationStats {
  pending_moderation: number
  approved: number
  flagged: number
  blocked: number
  total: number
}

export const adminService = {
  listUsers: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  setUserRole: (id: string, role: 'user' | 'moderator' | 'admin') =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  listPosts: (params?: { status?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Post>>('/admin/posts', { params }).then((r) => r.data),

  setPostStatus: (id: string, status: string, is_hidden?: boolean) =>
    api.patch<Post>(`/admin/posts/${id}/status`, { status, is_hidden }).then((r) => r.data),

  listReports: (params?: { status?: string; page?: number; per_page?: number }) =>
    api.get<ReportListResult>('/admin/reports', { params }).then((r) => r.data),

  updateReport: (id: string, status: 'resolved' | 'dismissed') =>
    api.patch(`/admin/reports/${id}`, { status }).then((r) => r.data),

  getModerationStats: () =>
    api.get<ModerationStats>('/admin/moderation/stats').then((r) => r.data),

  listModerationQueue: (params?: { status?: string; type?: string; page?: number; per_page?: number }) =>
    api.get<ModerationListResult>('/admin/moderation/queue', { params }).then((r) => r.data),

  reviewPost: (id: string, status: string) =>
    api.patch(`/admin/moderation/posts/${id}`, { status }).then((r) => r.data),

  reviewComment: (id: string, status: string) =>
    api.patch(`/admin/moderation/comments/${id}`, { status }).then((r) => r.data),
}
