import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard admin</h1>
      <p className="text-muted-foreground">À implémenter en semaine 3.</p>
    </div>
  )
}
