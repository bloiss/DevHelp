import { api } from '@/lib/api'
import type { PublicProfile } from '@/types/user'

export const followService = {
  follow: (username: string) =>
    api.post(`/users/${username}/follow`),

  unfollow: (username: string) =>
    api.delete(`/users/${username}/follow`),

  followers: (username: string) =>
    api.get<PublicProfile[]>(`/users/${username}/followers`).then((r) => r.data),

  following: (username: string) =>
    api.get<PublicProfile[]>(`/users/${username}/following`).then((r) => r.data),
}
