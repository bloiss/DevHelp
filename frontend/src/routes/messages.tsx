import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/messages')({
  component: MessagesPage,
})

function MessagesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <p className="text-muted-foreground">Messagerie privée — à implémenter en semaine 4.</p>
    </div>
  )
}
