import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/auth/register')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/forum' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <AuthCard
        title="Rejoindre DevHelp"
        description="Crée ton compte pour participer aux discussions."
      >
        <RegisterForm />
      </AuthCard>
    </div>
  )
}
