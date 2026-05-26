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

// Profil public retourné par GET /users/:username
export interface PublicProfile {
  id: string
  username: string
  avatar_url?: string
  role: UserRole
  created_at: string
  post_count: number
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}
