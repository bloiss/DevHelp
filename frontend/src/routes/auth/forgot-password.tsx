import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/AuthCard'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/auth/forgot-password')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/forum' })
    }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <AuthCard
        title="Mot de passe oublié ?"
        description="Saisis ton email et on t'envoie un lien pour réinitialiser ton mot de passe."
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  )
}
