import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthCard } from '@/components/auth/AuthCard'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/forum' })
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
        <AuthCard
          title="Lien invalide"
          description="Ce lien de réinitialisation est invalide ou a expiré."
        >
          <div className="text-center">
            <Link to="/auth/forgot-password">
              <Button variant="outline" className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>
          </div>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <AuthCard
        title="Nouveau mot de passe"
        description="Choisis un mot de passe sécurisé d'au moins 8 caractères."
      >
        <ResetPasswordForm token={token} />
      </AuthCard>
    </div>
  )
}
