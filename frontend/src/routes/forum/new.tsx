import { createFileRoute, redirect } from '@tanstack/react-router'
import { CreatePostForm } from '@/components/forum/CreatePostForm'
import { BackButton } from '@/components/shared/BackButton'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/forum/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: NewPostPage,
})

function NewPostPage() {
  const { category } = Route.useSearch()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Créer un post</h1>
        <p className="text-sm text-muted-foreground">
          Sois précis dans ton titre — une bonne question obtient une réponse plus rapidement.
        </p>
      </div>
      <CreatePostForm defaultCategorySlug={category} />
    </div>
  )
}
