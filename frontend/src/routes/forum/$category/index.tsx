import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/forum/$category/')({
  component: CategoryPage,
})

function CategoryPage() {
  const { category } = Route.useParams()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold capitalize mb-6">{category}</h1>
      {/* PostCard list — à brancher à l'API en semaine 2 */}
      <p className="text-muted-foreground">Chargement des posts…</p>
    </div>
  )
}
