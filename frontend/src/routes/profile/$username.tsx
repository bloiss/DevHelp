import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, PenSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/forum/PostCard'
import { PostCardSkeleton } from '@/components/forum/PostCardSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/user.service'
import { postService } from '@/services/post.service'
import { formatDate } from '@/lib/utils'
import { fadeInUp, stagger, staggerFast } from '@/lib/animations'

export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
})

const ROLE_LABEL: Record<string, string | null> = {
  moderator: 'Modérateur',
  admin: 'Admin',
  user: null,
}

function ProfilePage() {
  const { username } = Route.useParams()
  const { user: currentUser } = useAuthStore()

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userService.getProfile(username),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', { author: username }],
    queryFn: () => postService.list({ author: username, per_page: 20 }),
    enabled: !!profile,
  })

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="flex gap-6 items-start mb-8">
          <div className="h-20 w-20 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-52 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card px-4 py-5">
              <div className="h-8 w-10 bg-muted animate-pulse rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="space-y-3 pt-4">
          {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (isError || !profile) throw notFound()

  const userPosts = postsData?.data ?? []
  const totalVotes = userPosts.reduce((sum, p) => sum + (p.vote_count ?? 0), 0)
  const isOwnProfile = currentUser?.username === username
  const roleLabel = ROLE_LABEL[profile.role] ?? null

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <Avatar
          user={profile}
          size="lg"
          className="h-20 w-20 text-2xl shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  @{profile.username}
                </h1>
                {roleLabel && (
                  <Badge variant="secondary">{roleLabel}</Badge>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Membre depuis {formatDate(profile.created_at)}
              </p>
            </div>

            {isOwnProfile && (
              <Link to="/settings">
                <Button variant="outline" size="sm" className="shrink-0">
                  Modifier le profil
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-px mb-10 rounded-xl border border-border bg-border overflow-hidden">
        <div className="bg-card px-4 py-5 text-center">
          <p className="text-2xl font-bold tabular-nums">{profile.post_count}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            post{profile.post_count > 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-card px-4 py-5 text-center">
          <p className="text-2xl font-bold tabular-nums">{totalVotes}</p>
          <p className="text-sm text-muted-foreground mt-0.5">votes reçus</p>
        </div>
        <div className="bg-card px-4 py-5 text-center">
          <p className="text-2xl font-bold tabular-nums text-muted-foreground">—</p>
          <p className="text-sm text-muted-foreground mt-0.5">réponses</p>
        </div>
      </motion.div>

      {/* Posts */}
      <motion.h2 variants={fadeInUp} className="font-semibold text-base mb-4">Posts récents</motion.h2>

      {postsLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : userPosts.length > 0 ? (
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerFast}
          initial="hidden"
          animate="visible"
        >
          {userPosts.map((post) => (
            <motion.div key={post.id} variants={fadeInUp}>
              <PostCard post={post} categorySlug={post.category.slug} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeInUp}>
          <EmptyState
            icon={<PenSquare className="h-10 w-10" />}
            title="Aucun post pour l'instant"
            description="Cet utilisateur n'a pas encore posté de question."
          />
        </motion.div>
      )}
    </motion.div>
  )
}
