import { api } from '@/lib/api'
import type { Category } from '@/types/post'

export const categoryService = {
  list: () =>
    api.get<Category[]>('/categories').then((r) => r.data),

  get: (slug: string) =>
    api.get<Category>(`/categories/${slug}`).then((r) => r.data),

  // ─── Admin ────────────────────────────────────────────────────
  create: (data: { name: string; description?: string; pillar?: string }) =>
    api.post<Category>('/admin/categories', data).then((r) => r.data),

  update: (id: string, data: { name: string; description?: string; pillar?: string }) =>
    api.put<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/admin/categories/${id}`),
}
