import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Bot, Flag, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeDate } from '@/lib/utils'

export const Route = createFileRoute('/admin/moderation')({
  component: ModerationPage,
})

// ─── Types mock ───────────────────────────────────────────────────

type AIVerdict = 'approved' | 'flagged' | 'blocked'
type ReportStatus = 'pending' | 'resolved' | 'dismissed'

interface ModerationEntry {
  id: string
  targetType: 'post' | 'comment'
  targetTitle: string
  aiVerdict: AIVerdict
  aiReason: string
  aiConfidence: number
  reviewed: boolean
  createdAt: string
}

interface ReportEntry {
  id: string
  reporter: string
  targetType: 'post' | 'comment' | 'user'
  targetTitle: string
  reason: string
  status: ReportStatus
  createdAt: string
}

// ─── Mock ─────────────────────────────────────────────────────────

const MOCK_MODERATION: ModerationEntry[] = [
  {
    id: 'ml1', targetType: 'post',
    targetTitle: 'Pourquoi useEffect se déclenche deux fois en React 18 ?',
    aiVerdict: 'approved', aiConfidence: 96,
    aiReason: 'Contenu technique pertinent, aucun élément inapproprié détecté.',
    reviewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'ml2', targetType: 'comment',
    targetTitle: 'Achète des likes maintenant sur bestlikes.io !!!',
    aiVerdict: 'blocked', aiConfidence: 99,
    aiReason: 'Contenu publicitaire non sollicité, lien externe suspect.',
    reviewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'ml3', targetType: 'post',
    targetTitle: 'Zustand ou Redux Toolkit pour une appli de taille moyenne ?',
    aiVerdict: 'flagged', aiConfidence: 71,
    aiReason: 'Contenu potentiellement hors-sujet pour la rubrique. Vérification recommandée.',
    reviewed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'ml4', targetType: 'post',
    targetTitle: 'Comment structurer les dossiers d\'un projet React en équipe ?',
    aiVerdict: 'approved', aiConfidence: 94,
    aiReason: 'Question de bonne qualité, bien formulée et pertinente.',
    reviewed: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

const MOCK_REPORTS: ReportEntry[] = [
  {
    id: 'r1', reporter: 'alex_dev', targetType: 'post',
    targetTitle: 'Achète des likes maintenant sur bestlikes.io !!!',
    reason: 'Spam / contenu publicitaire',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'r2', reporter: 'camille_r', targetType: 'comment',
    targetTitle: 'Commentaire sur le post useEffect',
    reason: 'Harcèlement envers l\'auteur',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'r3', reporter: 'leo_dev42', targetType: 'user',
    targetTitle: 'Utilisateur @spam_bot',
    reason: 'Compte spam automatisé',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

// ─── Config visuels ───────────────────────────────────────────────

const VERDICT_CONFIG: Record<AIVerdict, { label: string; class: string }> = {
  approved: { label: 'Approuvé', class: 'bg-green-500/10 text-green-600' },
  flagged:  { label: 'Signalé',  class: 'bg-amber-500/10 text-amber-600' },
  blocked:  { label: 'Bloqué',   class: 'bg-red-500/10 text-red-600' },
}

const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; class: string }> = {
  pending:   { label: 'En attente', class: 'bg-amber-500/10 text-amber-600' },
  resolved:  { label: 'Résolu',     class: 'bg-green-500/10 text-green-600' },
  dismissed: { label: 'Ignoré',     class: 'bg-muted text-muted-foreground' },
}

const TARGET_LABEL = { post: 'Post', comment: 'Commentaire', user: 'Utilisateur' }

// ─── Sous-navigation ──────────────────────────────────────────────

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

type Tab = 'ai' | 'reports'

function ModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ai')
  const [moderation, setModeration] = useState(MOCK_MODERATION)
  const [reports, setReports] = useState(MOCK_REPORTS)

  function reviewEntry(id: string) {
    setModeration((prev) =>
      prev.map((e) => (e.id === id ? { ...e, reviewed: true } : e)),
    )
  }

  function resolveReport(id: string, status: 'resolved' | 'dismissed') {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    )
  }

  const pendingAI = moderation.filter((e) => !e.reviewed).length
  const pendingReports = reports.filter((r) => r.status === 'pending').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Modération IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Verdicts générés automatiquement — révise les cas ambigus.
        </p>
      </div>

      <AdminNav />

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {([
          { key: 'ai' as Tab, label: 'Verdicts IA', count: pendingAI, icon: Bot },
          { key: 'reports' as Tab, label: 'Signalements', count: pendingReports, icon: Flag },
        ]).map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 text-sm rounded-md font-medium transition-all',
              activeTab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                activeTab === key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted-foreground/20 text-muted-foreground',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Verdicts IA ── */}
      {activeTab === 'ai' && (
        <div className="flex flex-col gap-4">
          {moderation.map((entry) => {
            const verdict = VERDICT_CONFIG[entry.aiVerdict]
            return (
              <div
                key={entry.id}
                className={cn(
                  'rounded-xl border border-border bg-card p-5',
                  entry.reviewed && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {TARGET_LABEL[entry.targetType]}
                      </Badge>
                      <span
                        className={cn('text-xs px-2.5 py-1 rounded-full font-medium', verdict.class)}
                      >
                        {verdict.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Confiance : <span className="font-medium text-foreground">{entry.aiConfidence}%</span>
                      </span>
                    </div>

                    <p className="font-medium text-sm mb-1 truncate">{entry.targetTitle}</p>

                    <div className="flex items-start gap-1.5 mt-2">
                      <Bot className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {entry.aiReason}
                      </p>
                    </div>

                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      {formatRelativeDate(entry.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  {!entry.reviewed ? (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
                        onClick={() => reviewEntry(entry.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => reviewEntry(entry.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Corriger
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">Révisé</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Signalements ── */}
      {activeTab === 'reports' && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {reports.map((report) => {
              const statusCfg = REPORT_STATUS_CONFIG[report.status]
              return (
                <div key={report.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium">{report.reporter}</span>
                      <span className="text-xs text-muted-foreground">a signalé un</span>
                      <Badge variant="secondary" className="text-xs">
                        {TARGET_LABEL[report.targetType]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{report.targetTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 italic">"{report.reason}"</p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(report.createdAt)}
                  </div>

                  <span className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                    statusCfg.class,
                  )}>
                    {statusCfg.label}
                  </span>

                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
                        onClick={() => resolveReport(report.id, 'resolved')}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Résoudre
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => resolveReport(report.id, 'dismissed')}
                      >
                        Ignorer
                      </Button>
                    </div>
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
