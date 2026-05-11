import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      {/* LoginForm — à implémenter en semaine 1 */}
      <p className="text-muted-foreground">Formulaire de connexion à venir.</p>
    </div>
  )
}
