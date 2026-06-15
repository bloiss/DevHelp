export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  role: UserRole
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface PublicProfile {
  id: string
  username: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  role: UserRole
  created_at: string
  post_count: number
  follower_count: number
  following_count: number
  is_following: boolean
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}
