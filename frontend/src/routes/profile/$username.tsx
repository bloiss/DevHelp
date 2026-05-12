import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { CalendarDays, PenSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/forum/PostCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { MOCK_POSTS } from '@/data/mockPosts'
import { useAuthStore } from '@/stores/authStore'
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

  const userPosts = MOCK_POSTS.filter((p) => p.author.username === username)

  // Priorité au currentUser si c'est son propre profil
  const profileUser =
    currentUser?.username === username ? currentUser : userPosts[0]?.author

  if (!profileUser) throw notFound()

  const isOwnProfile = currentUser?.username === username
  const totalVotes = userPosts.reduce((sum, p) => sum + (p.vote_count ?? 0), 0)
  const roleLabel = ROLE_LABEL[profileUser.role] ?? null

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
          user={profileUser}
          size="lg"
          className="h-20 w-20 text-2xl shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  @{profileUser.username}
                </h1>
                {roleLabel && (
                  <Badge variant="secondary">{roleLabel}</Badge>
                )}
              </div>

              {profileUser.created_at && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Membre depuis {formatDate(profileUser.created_at)}
                </p>
              )}
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
          <p className="text-2xl font-bold tabular-nums">{userPosts.length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            post{userPosts.length > 1 ? 's' : ''}
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

      {userPosts.length > 0 ? (
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
