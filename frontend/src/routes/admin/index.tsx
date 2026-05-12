import { createFileRoute, Link } from '@tanstack/react-router'
import { Users, FileText, Flag, Bot, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeDate } from '@/lib/utils'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

// ─── Mock ─────────────────────────────────────────────────────────

const STATS = [
  { label: 'Utilisateurs', value: 127, icon: Users, color: 'bg-blue-500/10 text-blue-500' },
  { label: 'Posts publiés', value: 284, icon: FileText, color: 'bg-green-500/10 text-green-500' },
  { label: 'Signalements en attente', value: 6, icon: Flag, color: 'bg-amber-500/10 text-amber-500' },
  { label: 'Verdicts IA à réviser', value: 3, icon: Bot, color: 'bg-violet-500/10 text-violet-500' },
]

interface ReportPreview {
  id: string
  reporter: string
  targetType: 'post' | 'comment' | 'user'
  reason: string
  createdAt: string
  status: 'pending' | 'resolved' | 'dismissed'
}

const RECENT_REPORTS: ReportPreview[] = [
  {
    id: 'r1', reporter: 'alex_dev', targetType: 'post',
    reason: 'Contenu inapproprié',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'pending',
  },
  {
    id: 'r2', reporter: 'camille_r', targetType: 'comment',
    reason: 'Spam',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'pending',
  },
  {
    id: 'r3', reporter: 'leo_dev42', targetType: 'user',
    reason: 'Harcèlement',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'pending',
  },
  {
    id: 'r4', reporter: 'marie_js', targetType: 'post',
    reason: 'Hors-sujet',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'resolved',
  },
]

const TARGET_LABEL = { post: 'Post', comment: 'Commentaire', user: 'Utilisateur' }

const STATUS_BADGE: Record<ReportPreview['status'], { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'bg-amber-500/10 text-amber-600' },
  resolved: { label: 'Résolu', class: 'bg-green-500/10 text-green-600' },
  dismissed: { label: 'Ignoré', class: 'bg-muted text-muted-foreground' },
}

// ─── Sous-navigation admin ─────────────────────────────────────────

function AdminNav() {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-8">
      {[
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/moderation', label: 'Modération IA' },
      ].map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="px-4 py-1.5 text-sm rounded-md font-medium transition-all text-muted-foreground hover:text-foreground"
          activeProps={{ className: 'bg-background text-foreground shadow-sm px-4 py-1.5 text-sm rounded-md font-medium' }}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de la plateforme.</p>
      </div>

      <AdminNav />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className={cn('p-2.5 rounded-lg w-fit mb-3', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Signalements récents */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">Signalements récents</h2>
        <Link
          to="/admin/moderation"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Voir tout <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {RECENT_REPORTS.map((report) => (
            <div key={report.id} className="flex items-center gap-4 px-4 py-3.5">

              {/* Reporter + cible */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{report.reporter}</span>
                  <span className="text-xs text-muted-foreground">a signalé un</span>
                  <Badge variant="secondary" className="text-xs">
                    {TARGET_LABEL[report.targetType]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{report.reason}</p>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(report.createdAt)}
              </div>

              {/* Statut */}
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                STATUS_BADGE[report.status].class,
              )}>
                {STATUS_BADGE[report.status].label}
              </span>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
