import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
})

function ProfilePage() {
  const { username } = Route.useParams()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">@{username}</h1>
      <p className="text-muted-foreground">Profil utilisateur — à implémenter en semaine 2.</p>
    </div>
  )
}
