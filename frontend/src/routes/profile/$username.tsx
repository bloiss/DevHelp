import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { CalendarDays, PenSquare } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/forum/PostCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { MOCK_POSTS } from '@/data/mockPosts'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

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
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px mb-10 rounded-xl border border-border bg-border overflow-hidden">
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
      </div>

      {/* Posts */}
      <h2 className="font-semibold text-base mb-4">Posts récents</h2>

      {userPosts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} categorySlug={post.category.slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PenSquare className="h-10 w-10" />}
          title="Aucun post pour l'instant"
          description="Cet utilisateur n'a pas encore posté de question."
        />
      )}
    </div>
  )
}
