import { api } from '@/lib/api'
import type { Post, Comment } from '@/types/post'
import type { PaginatedResponse } from '@/types/api'

export const postService = {
  list: (params?: { category?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Post>>('/posts', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Post>(`/posts/${id}`).then((r) => r.data),

  create: (data: { title: string; content: string; category_id: string }) =>
    api.post<Post>('/posts', data).then((r) => r.data),

  update: (id: string, data: { title?: string; content?: string }) =>
    api.put<Post>(`/posts/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/posts/${id}`),

  vote: (id: string, value: 1 | -1) =>
    api.post(`/posts/${id}/like`, { value }),

  getComments: (postId: string) =>
    api.get<Comment[]>(`/posts/${postId}/comments`).then((r) => r.data),

  createComment: (postId: string, content: string) =>
    api.post<Comment>(`/posts/${postId}/comments`, { content }).then((r) => r.data),
}
