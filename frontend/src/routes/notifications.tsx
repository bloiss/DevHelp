import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <p className="text-muted-foreground">À implémenter en semaine 3.</p>
    </div>
  )
}
