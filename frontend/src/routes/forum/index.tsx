import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/forum/')({
  component: ForumHub,
})

function ForumHub() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Forum</h1>
      <p className="text-muted-foreground mb-8">Choisissez une catégorie pour explorer les discussions.</p>
      {/* CategoryCard list — sera branché à l'API en semaine 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <p className="text-muted-foreground col-span-full">Chargement des catégories…</p>
      </div>
    </div>
  )
}
