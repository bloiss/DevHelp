import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <p className="text-muted-foreground">Réinitialisation du mot de passe — à venir.</p>
    </div>
  )
}
