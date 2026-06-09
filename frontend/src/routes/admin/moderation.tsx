import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, Clock, ShieldAlert, XCircle,
  Flag, MessageSquare, FileText, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/admin.service'
import { toast } from '@/stores/toastStore'
import { formatRelativeDate, cn } from '@/lib/utils'
import type { Post } from '@/types/post'
import type { Report } from '@/services/admin.service'

export const Route = createFileRoute('/admin/moderation')({
  component: ModerationPage,
})

// ─── Badges ──────────────────────────────────────────────────────

const POST_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending_moderation: { label: 'En attente', class: 'bg-amber-500/10 text-amber-600' },
  approved:           { label: 'Approuvé',   class: 'bg-green-500/10 text-green-600' },
  flagged:            { label: 'Signalé',    class: 'bg-orange-500/10 text-orange-600' },
  blocked:            { label: 'Bloqué',     class: 'bg-red-500/10 text-red-600' },
}

const REPORT_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending:   { label: 'En attente',  class: 'bg-amber-500/10 text-amber-600' },
  resolved:  { label: 'Résolu',      class: 'bg-green-500/10 text-green-600' },
  dismissed: { label: 'Ignoré',      class: 'bg-muted text-muted-foreground' },
}

const REPORT_TYPE_ICON: Record<string, React.ReactNode> = {
  post:    <FileText className="h-3.5 w-3.5" />,
  comment: <MessageSquare className="h-3.5 w-3.5" />,
}

// ─── Onglet posts en attente ──────────────────────────────────────

function PendingPostsTab() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: () => adminService.listPosts({ status: 'pending_moderation', per_page: 50 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.setPostStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] })
      toast.success(`Post ${status === 'approved' ? 'approuvé' : 'bloqué'} !`)
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de modifier le statut.' }),
  })

  const posts: Post[] = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold">Tout est propre !</p>
        <p className="text-sm text-muted-foreground mt-1">Aucun post en attente de modération.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        const statusCfg = POST_STATUS_BADGE[post.status] ?? POST_STATUS_BADGE.pending_moderation
        return (
          <div key={post.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.class}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-1 leading-snug">{post.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Avatar user={post.author} size="sm" />
                  <span className="font-medium text-foreground">@{post.author.username}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeDate(post.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
                  onClick={() => statusMutation.mutate({ id: post.id, status: 'approved' })}
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approuver
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                  onClick={() => statusMutation.mutate({ id: post.id, status: 'blocked' })}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" /> Bloquer
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Onglet signalements ──────────────────────────────────────────

function ReportsTab() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: () => adminService.listReports({ status: statusFilter || undefined, per_page: 50 }),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      adminService.updateReport(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      toast.success(status === 'resolved' ? 'Signalement résolu' : 'Signalement ignoré')
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de traiter ce signalement.' }),
  })

  const reports: Report[] = data?.data ?? []

  const FILTERS = [
    { value: 'pending',   label: 'En attente' },
    { value: 'resolved',  label: 'Résolus' },
    { value: 'dismissed', label: 'Ignorés' },
    { value: '',          label: 'Tous' },
  ]

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md font-medium transition-all',
              statusFilter === f.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold">Aucun signalement</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === 'pending' ? 'Aucun contenu signalé en attente.' : 'Aucun résultat pour ce filtre.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const statusCfg = REPORT_STATUS_BADGE[report.status] ?? REPORT_STATUS_BADGE.pending
            return (
              <div key={report.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-2">

                    {/* Type + statut */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {REPORT_TYPE_ICON[report.target_type]}
                        {report.target_type === 'post' ? 'Post' : 'Commentaire'}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.class}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Contenu signalé */}
                    {report.target_title && (
                      <p className="font-semibold text-sm leading-snug">{report.target_title}</p>
                    )}
                    {report.target_content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
                        {report.target_content}
                      </p>
                    )}

                    {/* Raison */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Flag className="h-3 w-3 text-orange-500 shrink-0" />
                      <span className="text-foreground font-medium">Raison :</span>
                      <span className="text-muted-foreground">{report.reason}</span>
                    </div>

                    {/* Reporter + date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar user={report.reporter} size="sm" />
                      <span>Signalé par</span>
                      <span className="font-medium text-foreground">@{report.reporter.username}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeDate(report.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions (seulement si en attente) */}
                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm" variant="outline"
                        className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'resolved' })}
                        disabled={resolveMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" /> Résoudre
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="gap-1.5 text-muted-foreground hover:border-border"
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'dismissed' })}
                        disabled={resolveMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" /> Ignorer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────

type Tab = 'posts' | 'reports'

function ModerationPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('posts')

  const { data: postsData } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: () => adminService.listPosts({ status: 'pending_moderation', per_page: 1 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
  })

  const { data: reportsData } = useQuery({
    queryKey: ['admin', 'reports', 'pending'],
    queryFn: () => adminService.listReports({ status: 'pending', per_page: 1 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'moderator'),
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

  const pendingPosts   = postsData?.total ?? 0
  const pendingReports = reportsData?.total ?? 0

  const TABS: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'posts',   label: 'Posts en attente', count: pendingPosts,   icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'reports', label: 'Signalements',      count: pendingReports, icon: <Flag className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <ShieldAlert className="h-5 w-5 text-orange-500" />
        <h1 className="text-xl font-bold tracking-tight">Modération</h1>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full tabular-nums font-bold',
                activeTab === tab.key
                  ? 'bg-orange-500/15 text-orange-600'
                  : 'bg-muted-foreground/20 text-muted-foreground',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'posts'   && <PendingPostsTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  )
}
