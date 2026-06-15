import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from '@/stores/toastStore'
import type { User } from '@/types/user'

export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallbackPage,
})

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { setAuth, setTokens, logout } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const error = params.get('error')

    if (error || !accessToken || !refreshToken) {
      toast.error('Connexion échouée', { description: 'Réessaie depuis la page de connexion.' })
      navigate({ to: '/auth/login' })
      return
    }

    setTokens(accessToken, refreshToken)

    api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        setAuth(data, accessToken, refreshToken)
        toast.success(`Bienvenue, @${data.username} !`)
        navigate({ to: '/forum' })
      })
      .catch(() => {
        logout()
        toast.error('Connexion échouée', { description: 'Réessaie depuis la page de connexion.' })
        navigate({ to: '/auth/login' })
      })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Connexion en cours…</p>
      </div>
    </div>
  )
}
