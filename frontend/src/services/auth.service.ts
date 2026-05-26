import { api } from '@/lib/api'
import type { AuthResponse } from '@/types/user'

export interface RegisterInput {
  email: string
  username: string
  password: string
  captcha_token: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authService = {
  register: (data: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginInput) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
}
