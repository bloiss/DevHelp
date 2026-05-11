import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { queryClient } from '@/lib/queryClient'
import type { LoginInput, RegisterInput } from '@/services/auth.service'

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout, refreshToken } = useAuthStore()

  async function login(data: LoginInput) {
    const res = await authService.login(data)
    setAuth(res.user, res.access_token, res.refresh_token)
    return res
  }

  async function register(data: RegisterInput) {
    const res = await authService.register(data)
    setAuth(res.user, res.access_token, res.refresh_token)
    return res
  }

  async function logout() {
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {})
    }
    storeLogout()
    queryClient.clear()
  }

  return { user, isAuthenticated, login, register, logout }
}
