export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  role: UserRole
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}
