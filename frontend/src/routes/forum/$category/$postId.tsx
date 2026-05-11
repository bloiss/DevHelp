import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/forum/$category/$postId')({
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Post detail + commentaires — à implémenter en semaine 2 */}
      <p className="text-muted-foreground">Post {postId} — à venir.</p>
    </div>
  )
}
