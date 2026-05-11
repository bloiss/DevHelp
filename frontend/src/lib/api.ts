import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Injecte automatiquement le JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si le serveur renvoie 401, tente un refresh automatique du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState()
        if (!refreshToken) {
          logout()
          return Promise.reject(error)
        }
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'}/auth/refresh`,
          { refresh_token: refreshToken },
        )
        setTokens(data.access_token, data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  },
)
