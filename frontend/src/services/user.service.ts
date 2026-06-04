import { api } from '@/lib/api'
import type { User, PublicProfile } from '@/types/user'

// Shape exacte retournée par GET /users/:username
interface ProfileAPIResponse {
  user: User & { bio?: string }
  post_count: number
  follower_count: number
  following_count: number
  is_following: boolean
}

export const userService = {
  getProfile: (username: string) =>
    api.get<ProfileAPIResponse>(`/users/${username}`).then((r) => {
      const { user, post_count, follower_count, following_count, is_following } = r.data
      return {
        ...user,
        post_count,
        follower_count,
        following_count,
        is_following,
      } as PublicProfile
    }),

  updateMe: (data: { username?: string; avatar_url?: string; banner_url?: string; bio?: string }) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
}
