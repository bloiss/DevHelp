import { api } from '@/lib/api'
import type { User } from '@/types/user'

export const userService = {
  getProfile: (username: string) =>
    api.get<User>(`/users/${username}`).then((r) => r.data),

  updateMe: (data: { username?: string; avatar_url?: string }) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
}
