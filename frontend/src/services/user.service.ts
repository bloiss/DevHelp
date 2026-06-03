import { api } from '@/lib/api'
import type { User, PublicProfile } from '@/types/user'

export const userService = {
  getProfile: (username: string) =>
    api.get<PublicProfile>(`/users/${username}`).then((r) => r.data),

  updateMe: (data: { username?: string; avatar_url?: string }) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
}
