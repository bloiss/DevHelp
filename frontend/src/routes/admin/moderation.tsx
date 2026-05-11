import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/moderation')({
  component: ModerationPage,
})

function ModerationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modération IA</h1>
      <p className="text-muted-foreground">Verdicts IA et corrections — à implémenter en semaine 4.</p>
    </div>
  )
}
