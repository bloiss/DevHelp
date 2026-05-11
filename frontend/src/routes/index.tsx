import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        DevHelp
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        La communauté des développeurs. Posez vos questions, partagez vos connaissances, progressez ensemble.
      </p>
      <div className="flex gap-4">
        <a
          href="/forum"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Explorer le forum
        </a>
        <a
          href="/auth/register"
          className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
        >
          S'inscrire
        </a>
      </div>
    </div>
  )
}
