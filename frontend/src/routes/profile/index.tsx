import { createFileRoute, redirect } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { AuthWall } from '@/components/shared/AuthWall'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/profile/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    if (user) {
      throw redirect({ to: '/profile/$username', params: { username: user.username } })
    }
  },
  component: ProfileIndexPage,
})

function ProfileIndexPage() {
  return (
    <AuthWall
      icon={<User className="h-8 w-8" />}
      title="Accède à ton profil"
      description="Connecte-toi pour gérer ton profil, suivre tes contributions, consulter tes badges et personnaliser ton expérience sur DevHelp."
    />
  )
}
