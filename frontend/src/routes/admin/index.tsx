import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Tag, Users, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/admin.service'
import { categoryService } from '@/services/category.service'

export const Route = createFileRoute('/admin/')({
  component: AdminPage,
})

const CARDS = [
  {
    to: '/admin/categories' as const,
    icon: Tag,
    title: 'Catégories',
    description: 'Créer, modifier ou supprimer les catégories du forum',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    statKey: 'categories',
  },
  {
    to: '/admin/users' as const,
    icon: Users,
    title: 'Utilisateurs',
    description: 'Consulter les comptes et gérer les rôles',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    statKey: 'users',
  },
  {
    to: '/admin/moderation' as const,
    icon: ShieldAlert,
    title: 'Modération',
    description: 'Traiter les posts en attente de validation',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    statKey: 'pending',
  },
]

function AdminPage() {
  const { user } = useAuthStore()

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers({ per_page: 1 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: () => adminService.listPosts({ status: 'pending_moderation', per_page: 1 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  })

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    )
  }

  const stats: Record<string, number | undefined> = {
    categories: categories?.length,
    users: usersData?.total,
    pending: pendingData?.total,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion du forum DevHelp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map(({ to, icon: Icon, title, description, color, bg, statKey }) => {
          const count = stats[statKey]
          return (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                {count !== undefined && (
                  <span className="text-2xl font-bold tabular-nums">{count}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
