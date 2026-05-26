import { api } from '@/lib/api'
import type { Category } from '@/types/post'

export const categoryService = {
  list: () =>
    api.get<Category[]>('/categories').then((r) => r.data),

  get: (slug: string) =>
    api.get<Category>(`/categories/${slug}`).then((r) => r.data),
}
