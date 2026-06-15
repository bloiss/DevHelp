import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ShieldAlert, CheckCircle, XCircle, Flag,
  AlertCircle, Clock, FileText, MessageSquare, Bot, User2,
  ChevronRight, X, Check, RotateCcw, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/admin.service'
import type { ModerationItem, ModerationLog } from '@/services/admin.service'
import type { Report } from '@/services/admin.service'
import { toast } from '@/stores/toastStore'
import { formatRelativeDate, cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/moderation')({
  component: ModerationPage,
})

const CONTENT_STATUS: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending_moderation: { label: 'En attente',  class: 'bg-amber-500/10 text-amber-600',  icon: <Clock className="h-3 w-3" /> },
  approved:           { label: 'Approuvé',    class: 'bg-green-500/10 text-green-600',  icon: <CheckCircle className="h-3 w-3" /> },
  flagged:            { label: 'Signalé',     class: 'bg-orange-500/10 text-orange-600', icon: <Flag className="h-3 w-3" /> },
  blocked:            { label: 'Bloqué',      class: 'bg-red-500/10 text-red-600',      icon: <XCircle className="h-3 w-3" /> },
}

const AI_VERDICT: Record<string, { label: string; class: string }> = {
  approved: { label: 'Approuvé',  class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  flagged:  { label: 'Signalé',   class: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  rejected: { label: 'Rejeté',    class: 'bg-red-500/10 text-red-600 border-red-500/20' },
  error:    { label: 'Erreur',    class: 'bg-muted text-muted-foreground border-border' },
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score < 0.3 ? 'bg-green-500' : score < 0.7 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = CONTENT_STATUS[status] ?? CONTENT_STATUS.pending_moderation
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.class)}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function AIVerdictBadge({ verdict }: { verdict: string }) {
  const cfg = AI_VERDICT[verdict] ?? AI_VERDICT.error
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border', cfg.class)}>
      <Bot className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  )
}

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
      {label}
    </span>
  )
}

function AIDecisionBlock({ log }: { log?: ModerationLog }) {
  if (!log) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Pas encore analysé par l'IA
      </div>
    )
  }

  const reasons = log.ai_reason ? log.ai_reason.split('; ').filter(Boolean) : []
  const categories = log.ai_categories ? log.ai_categories.split(',').filter(Boolean) : []

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Décision IA</span>
          {log.ai_provider && (
            <span className="text-[10px] text-muted-foreground/60">{log.ai_provider}</span>
          )}
        </div>
        <AIVerdictBadge verdict={log.ai_verdict} />
      </div>

      {log.ai_confidence != null && (
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Confiance</span>
          <ScoreBar score={log.ai_confidence} />
        </div>
      )}

      {reasons.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Raisons</span>
          <ul className="space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-muted-foreground mt-0.5">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => <CategoryChip key={cat} label={cat} />)}
        </div>
      )}

      {log.ai_verdict === 'error' && log.ai_reason && (
        <div className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{log.ai_reason}</span>
        </div>
      )}

      {log.final_status && (
        <div className="pt-1.5 border-t border-border flex items-center gap-2 text-xs">
          <User2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Décision humaine :</span>
          <StatusBadge status={log.final_status} />
          {log.reviewed_at && (
            <span className="text-muted-foreground ml-auto">{formatRelativeDate(log.reviewed_at)}</span>
          )}
        </div>
      )}
    </div>
  )
}

function DetailModal({
  item,
  onClose,
  onReview,
}: {
  item: ModerationItem
  onClose: () => void
  onReview: (contentType: string, id: string, status: string) => void
}) {
  const title = item.post?.title ?? 'Commentaire'
  const content = item.post?.content ?? item.comment?.content ?? ''
  const author = item.post?.author ?? item.comment?.author
  const createdAt = item.post?.created_at ?? item.comment?.created_at ?? ''
  const currentStatus = item.post?.status ?? item.comment?.status ?? ''
  const id = item.post?.id ?? item.comment?.id ?? ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              {item.type === 'post' ? <FileText className="h-4 w-4 text-muted-foreground" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
              <h2 className="font-semibold text-sm">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={currentStatus} />
              {item.type === 'post' && item.post?.category && (
                <Badge variant="secondary" className="text-xs">{item.post.category.name}</Badge>
              )}
              {author && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                  <Avatar user={author} size="sm" />
                  <span className="font-medium text-foreground">@{author.username}</span>
                  <span>·</span>
                  <span>{formatRelativeDate(createdAt)}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div
                className="text-sm leading-relaxed text-foreground break-words prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            <AIDecisionBlock log={item.log} />
          </div>

          <div className="flex items-center gap-2 px-5 py-4 border-t border-border shrink-0 bg-muted/20 flex-wrap">
            <span className="text-xs text-muted-foreground mr-auto">Décision manuelle :</span>
            <Button size="sm" variant="outline"
              className="gap-1.5 text-green-600 hover:text-green-700 hover:border-green-300"
              onClick={() => { onReview(item.type, id, 'approved'); onClose() }}
            >
              <Check className="h-3.5 w-3.5" /> Approuver
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1.5 text-orange-500 hover:text-orange-600 hover:border-orange-300"
              onClick={() => { onReview(item.type, id, 'flagged'); onClose() }}
            >
              <Flag className="h-3.5 w-3.5" /> Signaler
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
              onClick={() => { onReview(item.type, id, 'blocked'); onClose() }}
            >
              <XCircle className="h-3.5 w-3.5" /> Bloquer
            </Button>
            {currentStatus !== 'pending_moderation' && (
              <Button size="sm" variant="outline"
                className="gap-1.5 text-muted-foreground"
                onClick={() => { onReview(item.type, id, 'pending_moderation'); onClose() }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> En attente
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ItemCard({
  item,
  onReview,
  onDetail,
  isPending,
}: {
  item: ModerationItem
  onReview: (contentType: string, id: string, status: string) => void
  onDetail: () => void
  isPending: boolean
}) {
  const title = item.post?.title
  const excerpt = (item.post?.content ?? item.comment?.content ?? '').replace(/<[^>]*>/g, '').slice(0, 160)
  const author = item.post?.author ?? item.comment?.author
  const createdAt = item.post?.created_at ?? item.comment?.created_at ?? ''
  const currentStatus = item.post?.status ?? item.comment?.status ?? ''
  const id = item.post?.id ?? item.comment?.id ?? ''

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {item.type === 'post' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {item.type === 'post' ? 'Post' : 'Commentaire'}
            </span>
            <StatusBadge status={currentStatus} />
            {item.post?.category && (
              <Badge variant="secondary" className="text-xs">{item.post.category.name}</Badge>
            )}
          </div>
          {title && <p className="font-semibold text-sm leading-snug">{title}</p>}
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>
          )}
          {author && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Avatar user={author} size="sm" />
              <span className="font-medium text-foreground">@{author.username}</span>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{formatRelativeDate(createdAt)}</span>
            </div>
          )}
        </div>
        <button
          onClick={onDetail}
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <AIDecisionBlock log={item.log} />

      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button size="sm" variant="outline"
          className="gap-1 h-7 text-xs text-green-600 hover:text-green-700 hover:border-green-300"
          disabled={isPending || currentStatus === 'approved'}
          onClick={() => onReview(item.type, id, 'approved')}
        >
          <Check className="h-3 w-3" /> Approuver
        </Button>
        <Button size="sm" variant="outline"
          className="gap-1 h-7 text-xs text-orange-500 hover:text-orange-600 hover:border-orange-300"
          disabled={isPending || currentStatus === 'flagged'}
          onClick={() => onReview(item.type, id, 'flagged')}
        >
          <Flag className="h-3 w-3" /> Signaler
        </Button>
        <Button size="sm" variant="outline"
          className="gap-1 h-7 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
          disabled={isPending || currentStatus === 'blocked'}
          onClick={() => onReview(item.type, id, 'blocked')}
        >
          <XCircle className="h-3 w-3" /> Bloquer
        </Button>
        {currentStatus !== 'pending_moderation' && (
          <Button size="sm" variant="outline"
            className="gap-1 h-7 text-xs text-muted-foreground"
            disabled={isPending}
            onClick={() => onReview(item.type, id, 'pending_moderation')}
          >
            <RotateCcw className="h-3 w-3" /> En attente
          </Button>
        )}
        <button
          onClick={onDetail}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir détails <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

const STATUS_FILTERS = [
  { value: '',                  label: 'Tous' },
  { value: 'pending_moderation', label: 'En attente' },
  { value: 'approved',          label: 'Approuvés' },
  { value: 'flagged',           label: 'Signalés' },
  { value: 'blocked',           label: 'Bloqués' },
]

const TYPE_FILTERS = [
  { value: '',        label: 'Tout' },
  { value: 'post',    label: 'Posts' },
  { value: 'comment', label: 'Commentaires' },
]

function AITab() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['admin', 'moderation', 'stats'],
    queryFn: () => adminService.getModerationStats(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', 'queue', statusFilter, typeFilter],
    queryFn: () => adminService.listModerationQueue({ status: statusFilter, type: typeFilter, per_page: 30 }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ contentType, id, status }: { contentType: string; id: string; status: string }) =>
      contentType === 'post'
        ? adminService.reviewPost(id, status)
        : adminService.reviewComment(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] })
      const labels: Record<string, string> = {
        approved: 'approuvé',
        blocked: 'bloqué',
        flagged: 'signalé',
        pending_moderation: 'remis en attente',
      }
      toast.success(`Contenu ${labels[status] ?? 'mis à jour'}`)
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de mettre à jour le statut.' }),
  })

  const handleReview = (contentType: string, id: string, status: string) => {
    reviewMutation.mutate({ contentType, id, status })
  }

  const STAT_CARDS = [
    { key: 'pending_moderation', label: 'En attente', value: stats?.pending_moderation ?? 0, class: 'text-amber-600' },
    { key: 'approved',           label: 'Approuvés',  value: stats?.approved ?? 0,           class: 'text-green-600' },
    { key: 'flagged',            label: 'Signalés',   value: stats?.flagged ?? 0,            class: 'text-orange-500' },
    { key: 'blocked',            label: 'Bloqués',    value: stats?.blocked ?? 0,            class: 'text-red-600' },
  ]

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? '' : card.key)}
            className={cn(
              'rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-ring',
              statusFilter === card.key && 'border-ring bg-muted/40',
            )}
          >
            <p className={cn('text-2xl font-bold tabular-nums', card.class)}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {STATUS_FILTERS.map((f) => (
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

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md font-medium transition-all',
                typeFilter === f.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="ml-auto self-center text-xs text-muted-foreground">
          {(data?.total_posts ?? 0) + (data?.total_comments ?? 0)} résultats
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">Aucun contenu</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter ? 'Aucun résultat pour ce filtre.' : 'La file de modération est vide.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const id = item.post?.id ?? item.comment?.id ?? ''
            return (
              <ItemCard
                key={`${item.type}-${id}`}
                item={item}
                onReview={handleReview}
                onDetail={() => setSelectedItem(item)}
                isPending={reviewMutation.isPending}
              />
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onReview={handleReview}
          />
        )}
      </AnimatePresence>
    </div>
  )
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {REPORT_TYPE_ICON[report.target_type]}
                        {report.target_type === 'post' ? 'Post' : 'Commentaire'}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.class}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    {report.target_title && (
                      <p className="font-semibold text-sm leading-snug">{report.target_title}</p>
                    )}
                    {report.target_content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
                        {report.target_content}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Flag className="h-3 w-3 text-orange-500 shrink-0" />
                      <span className="text-foreground font-medium">Raison :</span>
                      <span className="text-muted-foreground">{report.reason}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar user={report.reporter} size="sm" />
                      <span>Signalé par</span>
                      <span className="font-medium text-foreground">@{report.reporter.username}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeDate(report.created_at)}</span>
                    </div>
                  </div>

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

type Tab = 'ai' | 'reports'

function ModerationPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('ai')

  const { data: statsData } = useQuery({
    queryKey: ['admin', 'moderation', 'stats'],
    queryFn: () => adminService.getModerationStats(),
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

  const pendingAI      = statsData?.pending_moderation ?? 0
  const pendingReports = reportsData?.total ?? 0

  const TABS: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'ai',      label: 'Modération IA', count: pendingAI,      icon: <Bot className="h-3.5 w-3.5" /> },
    { key: 'reports', label: 'Signalements',  count: pendingReports, icon: <Flag className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <ShieldAlert className="h-5 w-5 text-orange-500" />
        <h1 className="text-xl font-bold tracking-tight">Modération</h1>
      </div>

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

      {activeTab === 'ai'      && <AITab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  )
}
