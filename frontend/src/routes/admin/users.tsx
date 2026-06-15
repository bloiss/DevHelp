import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldAlert, Users } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/admin.service'
import { toast } from '@/stores/toastStore'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types/user'

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
})

const ROLE_OPTIONS = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'moderator', label: 'Modérateur' },
  { value: 'admin', label: 'Admin' },
] as const

const ROLE_BADGE: Record<string, { label: string; variant: 'secondary' | 'outline' | 'default' }> = {
  user:      { label: 'Utilisateur', variant: 'secondary' },
  moderator: { label: 'Modérateur',  variant: 'outline' },
  admin:     { label: 'Admin',       variant: 'default' },
}

function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers({ per_page: 50 }),
    enabled: !!currentUser && currentUser.role === 'admin',
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'moderator' | 'admin' }) =>
      adminService.setUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Rôle mis à jour !')
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de modifier le rôle.' }),
  })

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    )
  }

  const users: User[] = data?.data ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Users className="h-5 w-5 text-emerald-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Utilisateurs</h1>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">{data.total} compte{data.total > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {users.map((u) => {
              const badge = ROLE_BADGE[u.role]
              const isMe = u.id === currentUser.id
              return (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3.5">
                  <Avatar user={u} size="sm" className="shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">@{u.username}</span>
                      <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                      {isMe && (
                        <Badge variant="outline" className="text-xs">Vous</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email} · {formatDate(u.created_at)}</p>
                  </div>

                  {!isMe && (
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={u.role}
                      onChange={(e) =>
                        roleMutation.mutate({ id: u.id, role: e.target.value as 'user' | 'moderator' | 'admin' })
                      }
                      disabled={roleMutation.isPending}
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
