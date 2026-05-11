import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/search')({
  component: SearchPage,
})

function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Recherche</h1>
      <p className="text-muted-foreground">Recherche sémantique IA — à implémenter en semaine 4.</p>
    </div>
  )
}
