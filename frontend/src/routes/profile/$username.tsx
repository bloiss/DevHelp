import { useState } from 'react'
import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Settings, MessageSquare, UserPlus, UserCheck } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/forum/PostCard'
import { PostCardSkeleton } from '@/components/forum/PostCardSkeleton'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/user.service'
import { postService } from '@/services/post.service'
import { followService } from '@/services/follow.service'
import { messageService } from '@/services/message.service'
import { toast } from '@/stores/toastStore'
import { formatDate, cn } from '@/lib/utils'

export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
})

function ProfilePage() {
  const { username } = Route.useParams()
  const { user: me } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'posts' | 'followers' | 'following'>('posts')

  const isOwnProfile = me?.username === username

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userService.getProfile(username),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', { author: username }],
    queryFn: () => postService.list({ author: username, per_page: 30 }),
    enabled: !!profile && tab === 'posts',
  })

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', username],
    queryFn: () => followService.followers(username),
    enabled: tab === 'followers',
  })

  const { data: following = [] } = useQuery({
    queryKey: ['following', username],
    queryFn: () => followService.following(username),
    enabled: tab === 'following',
  })

  const followMutation = useMutation({
    mutationFn: () =>
      profile?.is_following ? followService.unfollow(username) : followService.follow(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
    },
    onError: () => toast.error('Erreur'),
  })

  if (isLoading) return (
    <div className="w-full">
      <div className="h-52 bg-muted animate-pulse" />
      <div className="px-4 pb-4">
        <div className="flex justify-between items-end -mt-12 mb-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse border-4 border-background" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-full mt-14" />
        </div>
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )

  if (isError || !profile) throw notFound()

  const posts = postsData?.data ?? []

  const ROLE_LABEL: Record<string, string | null> = {
    moderator: 'Modérateur', admin: 'Admin', user: null,
  }
  const roleLabel = ROLE_LABEL[profile.role] ?? null

  return (
    <div className="w-full">

      <div className="h-52 relative overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-muted">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Bannière" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-dot-grid opacity-20" />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 px-0 lg:px-6 w-full">

        <div className="flex-1 min-w-0 border-r border-border lg:border-r lg:pr-0">

          <div className="px-4 pb-0">
            <div className="flex items-end justify-between -mt-12 mb-3">
              <Avatar
                user={profile}
                size="lg"
                className="h-24 w-24 text-3xl rounded-full border-[3px] border-card shadow-[0_0_0_3px_hsl(var(--primary)/0.3)] shrink-0 relative z-10"
              />

              <div className="flex items-center gap-2 mb-1">
                {isOwnProfile ? (
                  <Link to="/settings">
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                      <Settings className="h-3.5 w-3.5" /> Modifier
                    </Button>
                  </Link>
                ) : me ? (
                  <>
                    <Button
                      variant="outline" size="sm"
                      className="rounded-full gap-2"
                      onClick={async () => {
                        try {
                          const conv = await messageService.openConversation(profile.id)
                          navigate({ to: '/messages', search: { conv: conv.id } })
                        } catch {
                          toast.error('Impossible d\'ouvrir la conversation')
                        }
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>
                    <Button
                      size="sm"
                      className={cn(
                        'rounded-full gap-2 font-semibold',
                        profile.is_following
                          ? 'bg-transparent border border-border text-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/5'
                          : 'bg-foreground text-background hover:bg-foreground/90',
                      )}
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                    >
                      {profile.is_following ? (
                        <><UserCheck className="h-3.5 w-3.5" /> Suivi</>
                      ) : (
                        <><UserPlus className="h-3.5 w-3.5" /> Suivre</>
                      )}
                    </Button>
                  </>
                ) : (
                  <Link to="/auth/login">
                    <Button size="sm" className="rounded-full gap-2 bg-foreground text-background">
                      <UserPlus className="h-3.5 w-3.5" /> Suivre
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="mb-1 flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {roleLabel && (
                <Badge style={{ background: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
                  className="text-[11px]">
                  {roleLabel}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm leading-relaxed mb-3 lg:hidden">{profile.bio}</p>
            )}

            <div className="flex items-center gap-5 text-sm mb-1 lg:hidden">
              <button onClick={() => setTab('following')} className="hover:underline">
                <span className="font-bold text-foreground">{profile.following_count ?? 0}</span>
                <span className="text-muted-foreground ml-1">abonnements</span>
              </button>
              <button onClick={() => setTab('followers')} className="hover:underline">
                <span className="font-bold text-foreground">{profile.follower_count ?? 0}</span>
                <span className="text-muted-foreground ml-1">abonnés</span>
              </button>
              <span>
                <span className="font-bold text-foreground">{profile.post_count ?? 0}</span>
                <span className="text-muted-foreground ml-1">posts</span>
              </span>
            </div>
          </div>

          <div className="flex border-b border-border mt-4">
            {(['posts', 'followers', 'following'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-3.5 text-sm font-medium transition-colors relative',
                  tab === t
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                )}
              >
                {t === 'posts' ? 'Posts' : t === 'followers' ? 'Abonnés' : 'Suivis'}
                {tab === t && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          {tab === 'posts' && (
            postsLoading ? (
              <div className="divide-y divide-border">
                {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            ) : posts.length > 0 ? (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} categorySlug={post.category.slug} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground text-sm">
                Aucun post pour l'instant.
              </div>
            )
          )}

          {(tab === 'followers' || tab === 'following') && (
            <div className="divide-y divide-border">
              {(tab === 'followers' ? followers : following).map((u) => (
                <Link
                  key={u.id}
                  to="/profile/$username"
                  params={{ username: u.username }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <Avatar user={u} size="md" className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{u.username}</p>
                    {u.role !== 'user' && (
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {u.role === 'moderator' ? 'Modo' : 'Admin'}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
              {(tab === 'followers' ? followers : following).length === 0 && (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  {tab === 'followers' ? 'Aucun abonné.' : "Ne suit personne."}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-80 shrink-0 pt-4 space-y-4">

          <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">À propos</h2>

            {profile.bio && (
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>Membre depuis {formatDate(profile.created_at)}</span>
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-3 gap-2 text-center">
              <button onClick={() => setTab('posts')} className="group hover:text-foreground transition-colors">
                <div className="text-lg font-bold text-foreground">{profile.post_count ?? 0}</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/80">Posts</div>
              </button>
              <button onClick={() => setTab('followers')} className="group hover:text-foreground transition-colors">
                <div className="text-lg font-bold text-foreground">{profile.follower_count ?? 0}</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/80">Abonnés</div>
              </button>
              <button onClick={() => setTab('following')} className="group hover:text-foreground transition-colors">
                <div className="text-lg font-bold text-foreground">{profile.following_count ?? 0}</div>
                <div className="text-xs text-muted-foreground group-hover:text-foreground/80">Suivis</div>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
