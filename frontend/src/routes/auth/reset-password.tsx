import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <p className="text-muted-foreground">Saisie du nouveau mot de passe — à venir.</p>
    </div>
  )
}
