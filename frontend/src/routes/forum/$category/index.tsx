import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { PenSquare, TrendingUp, Clock, MessageSquareOff } from 'lucide-react'
import { PostCard } from '@/components/forum/PostCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getCategoryBySlug } from '@/data/categories'
import { getMockPostsByCategory } from '@/data/mockPosts'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/forum/$category/')({
  component: CategoryPage,
})

const SORT_OPTIONS = [
  { key: 'recent', label: 'Récents', icon: Clock },
  { key: 'popular', label: 'Populaires', icon: TrendingUp },
  { key: 'unanswered', label: 'Sans réponse', icon: MessageSquareOff },
] as const

type SortKey = typeof SORT_OPTIONS[number]['key']

function CategoryPage() {
  const { category: slug } = Route.useParams()
  const { isAuthenticated } = useAuthStore()
  const [sort, setSort] = useState<SortKey>('recent')

  const category = getCategoryBySlug(slug)

  // Catégorie inconnue → 404
  if (!category) throw notFound()

  const Icon = category.icon
  const allPosts = getMockPostsByCategory(slug)

  const posts = [...allPosts].sort((a, b) => {
    if (sort === 'popular') return (b.vote_count ?? 0) - (a.vote_count ?? 0)
    if (sort === 'unanswered') return (a.comment_count ?? 0) - (b.comment_count ?? 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* En-tête catégorie */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl shrink-0', category.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{category.description}</p>
          </div>
        </div>

        {isAuthenticated && (
          <Link to="/forum/new">
            <Button className="shrink-0 gap-2">
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau post</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Barre de tri */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {SORT_OPTIONS.map(({ key, label, icon: SortIcon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all',
              sort === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <SortIcon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Liste des posts */}
      {posts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} categorySlug={slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquareOff className="h-10 w-10" />}
          title="Aucun post pour l'instant"
          description="Sois le premier à lancer la discussion dans cette rubrique."
          action={
            isAuthenticated ? (
              <Link to="/forum/new">
                <Button>Créer le premier post</Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button variant="outline">Se connecter pour poster</Button>
              </Link>
            )
          }
        />
      )}
    </div>
  )
}
