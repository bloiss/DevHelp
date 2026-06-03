import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Clock, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/admin.service'
import { toast } from '@/stores/toastStore'
import { formatRelativeDate } from '@/lib/utils'
import type { Post } from '@/types/post'

export const Route = createFileRoute('/admin/moderation')({
  component: ModerationPage,
})

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending_moderation: { label: 'En attente', class: 'bg-amber-500/10 text-amber-600' },
  approved:           { label: 'Approuvé',   class: 'bg-green-500/10 text-green-600' },
  flagged:            { label: 'Signalé',    class: 'bg-orange-500/10 text-orange-600' },
  blocked:            { label: 'Bloqué',     class: 'bg-red-500/10 text-red-600' },
}

function ModerationPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: () => adminService.listPosts({ status: 'pending_moderation', per_page: 50 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.setPostStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] })
      const label = status === 'approved' ? 'approuvé' : 'bloqué'
      toast.success(`Post ${label} !`)
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de modifier le statut.' }),
  })

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Cette page est réservée aux modérateurs.</p>
      </div>
    )
  }

  const posts: Post[] = data?.data ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <ShieldAlert className="h-5 w-5 text-orange-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Modération</h1>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.total} post{data.total > 1 ? 's' : ''} en attente
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">Tout est propre !</p>
          <p className="text-sm text-muted-foreground mt-1">Aucun post en attente de modération.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const statusCfg = STATUS_BADGE[post.status] ?? STATUS_BADGE.pending_moderation
            return (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Méta */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.class}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Titre */}
                    <p className="font-semibold text-sm mb-1 leading-snug">{post.title}</p>

                    {/* Extrait */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Auteur + date */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Avatar user={post.author} size="sm" />
                      <span className="font-medium text-foreground">@{post.author.username}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeDate(post.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
                      onClick={() => statusMutation.mutate({ id: post.id, status: 'approved' })}
                      disabled={statusMutation.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => statusMutation.mutate({ id: post.id, status: 'blocked' })}
                      disabled={statusMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Bloquer
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
