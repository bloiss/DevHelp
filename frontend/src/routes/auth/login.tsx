import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/auth/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/forum' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <AuthCard
        title="Bon retour !"
        description="Connecte-toi pour accéder au forum."
      >
        <LoginForm />
      </AuthCard>
    </div>
  )
}
