import { api } from '@/lib/api'
import type { User } from '@/types/user'
import type { Post } from '@/types/post'
import type { PaginatedResponse } from '@/types/api'
import type { Report, ReportListResult } from '@/services/report.service'

export type { Report }

export const adminService = {
  // ─── Users ────────────────────────────────────────────────────
  listUsers: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  setUserRole: (id: string, role: 'user' | 'moderator' | 'admin') =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  // ─── Posts ────────────────────────────────────────────────────
  listPosts: (params?: { status?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Post>>('/admin/posts', { params }).then((r) => r.data),

  setPostStatus: (id: string, status: string, is_hidden?: boolean) =>
    api.patch<Post>(`/admin/posts/${id}/status`, { status, is_hidden }).then((r) => r.data),

  // ─── Reports ──────────────────────────────────────────────────
  listReports: (params?: { status?: string; page?: number; per_page?: number }) =>
    api.get<ReportListResult>('/admin/reports', { params }).then((r) => r.data),

  updateReport: (id: string, status: 'resolved' | 'dismissed') =>
    api.patch(`/admin/reports/${id}`, { status }).then((r) => r.data),
}
