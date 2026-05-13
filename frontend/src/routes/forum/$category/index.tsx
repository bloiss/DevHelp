import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { PenSquare, TrendingUp, Clock, MessageSquareOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { PostCard }         from '@/components/forum/PostCard'
import { PostCardSkeleton } from '@/components/forum/PostCardSkeleton'
import { Button }           from '@/components/ui/button'
import { EmptyState }       from '@/components/shared/EmptyState'
import { getCategoryBySlug } from '@/data/categories'
import { getMockPostsByCategory } from '@/data/mockPosts'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { fadeInUp, stagger, staggerFast } from '@/lib/animations'

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
  const [sort, setSort]       = useState<SortKey>('recent')
  const [isLoading, setLoading] = useState(true)

  // Simulate API fetch — reset on every slug change
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [slug])

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
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >

      {/* En-tête catégorie */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4 mb-8">
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
      </motion.div>

      {/* Barre de tri */}
      <motion.div variants={fadeInUp} className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {SORT_OPTIONS.map(({ key, label, icon: SortIcon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all',
              sort === key
                ? 'bg-background text-foreground shadow-sm [--tw-shadow:0_1px_8px_var(--gold-glow)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={sort === key ? { boxShadow: '0 1px 8px var(--gold-glow)' } : undefined}
          >
            <SortIcon
              className="h-3.5 w-3.5"
              style={sort === key ? { color: 'var(--gold)' } : undefined}
            />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Liste des posts */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerFast}
          initial="hidden"
          animate="visible"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={fadeInUp}>
              <PostCard post={post} categorySlug={slug} />
            </motion.div>
          ))}
        </motion.div>
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
    </motion.div>
  )
}
