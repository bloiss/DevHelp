import { api } from '@/lib/api'
import type { PublicProfile } from '@/types/user'

export const followService = {
  follow: (username: string) =>
    api.post(`/users/${username}/follow`),

  unfollow: (username: string) =>
    api.delete(`/users/${username}/follow`),

  followers: (username: string) =>
    api.get<{ data: PublicProfile[] }>(`/users/${username}/followers`).then((r) => r.data.data ?? []),

  following: (username: string) =>
    api.get<{ data: PublicProfile[] }>(`/users/${username}/following`).then((r) => r.data.data ?? []),
}
