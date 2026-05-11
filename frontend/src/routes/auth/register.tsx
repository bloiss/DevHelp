import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      {/* RegisterForm — à implémenter en semaine 1 */}
      <p className="text-muted-foreground">Formulaire d'inscription à venir.</p>
    </div>
  )
}
