import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/forum/new')({
  component: NewPost,
})

function NewPost() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Créer un post</h1>
      {/* PostEditor — à implémenter en semaine 2 */}
      <p className="text-muted-foreground">Éditeur à venir.</p>
    </div>
  )
}
