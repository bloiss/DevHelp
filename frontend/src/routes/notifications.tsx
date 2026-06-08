import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Star,
  Archive,
  Trash2,
  Link2,
  Check,
  CheckCheck,
  Inbox,
  RotateCcw,
  Search,
  SortAsc,
  SortDesc,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { notificationService, type ApiNotification, type NotifPayload } from '@/services/notification.service'
import { AuthWall } from '@/components/shared/AuthWall'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toastStore'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getHref(n: ApiNotification): string | undefined {
  const p = n.payload
  if (p.conv_id) return `/messages?conv=${p.conv_id}`
  if (p.post_category && p.post_id) return `/forum/${p.post_category}/${p.post_id}`
  if (n.type === 'follow' && p.actor) return `/profile/${p.actor}`
  return undefined
}

function getTitle(n: ApiNotification): string {
  const p = n.payload
  switch (n.type) {
    case 'comment':          return `${p.actor} a commenté ton post`
    case 'like':             return `${p.actor} a aimé ton post`
    case 'follow':           return `${p.actor} te suit maintenant`
    case 'message_request':  return `${p.actor} t'a envoyé une demande de message`
    case 'message_accepted': return `${p.actor} a accepté ta demande de message`
    default:                 return n.type
  }
}

function getBody(n: ApiNotification): string {
  const p = n.payload
  if (p.post_title) return `"${p.post_title}"`
  if (n.type === 'follow') return 'Découvre son profil'
  if (n.type === 'message_request') return 'Clique pour voir la demande'
  if (n.type === 'message_accepted') return 'Vous pouvez maintenant discuter'
  return ''
}

function copyLink(href: string | undefined) {
  if (!href) return
  const url = `${window.location.origin}${href}`
  navigator.clipboard.writeText(url)
  toast.success('Lien copié !', { description: url })
}

// ─── Kind config ────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<string, {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  iconCls: string
  bgCls: string
}> = {
  comment:          { Icon: MessageSquare, label: 'Commentaire', iconCls: 'text-blue-500',    bgCls: 'bg-blue-500/10'    },
  like:             { Icon: ThumbsUp,      label: 'Like',        iconCls: 'text-amber-500',   bgCls: 'bg-amber-500/10'   },
  follow:           { Icon: UserPlus,      label: 'Abonnement',  iconCls: 'text-emerald-500', bgCls: 'bg-emerald-500/10' },
  message_request:  { Icon: MessageSquare, label: 'Message',     iconCls: 'text-violet-500',  bgCls: 'bg-violet-500/10'  },
  message_accepted: { Icon: MessageSquare, label: 'Message',     iconCls: 'text-violet-500',  bgCls: 'bg-violet-500/10'  },
}

function getKindConfig(type: string) {
  return KIND_CONFIG[type] ?? { Icon: Bell, label: type, iconCls: 'text-muted-foreground', bgCls: 'bg-muted' }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'starred' | 'archived'
type TypeFilter = 'comment' | 'like' | 'follow' | 'message' | null
type SortMode = 'newest' | 'oldest' | 'unread-first'

// ─── NotifRow ────────────────────────────────────────────────────────────────

interface NotifRowProps {
  notif: ApiNotification
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}

function NotifRow({ notif, onMarkRead, onMarkUnread, onStar, onArchive, onDelete }: NotifRowProps) {
  const navigate = useNavigate()
  const { Icon, iconCls, bgCls } = getKindConfig(notif.type)
  const href = getHref(notif)
  const title = getTitle(notif)
  const body = getBody(notif)

  function handleRowClick() {
    if (!notif.read) onMarkRead(notif.id)
    if (href) navigate({ to: href as never })
  }

  return (
    <div className="group relative flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 border-b border-border last:border-b-0 transition-colors">
      {!notif.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary shrink-0" />
      )}

      <div
        className={cn('shrink-0 p-2 rounded-lg mt-0.5 cursor-pointer', bgCls)}
        onClick={handleRowClick}
      >
        <Icon className={cn('h-4 w-4', iconCls)} />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleRowClick}>
        <p className={cn('text-sm leading-snug truncate', notif.read ? 'text-muted-foreground' : 'font-semibold text-foreground')}>
          {title}
        </p>
        {body && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{body}</p>
        )}
        <p
          className="text-xs text-muted-foreground/60 mt-1"
          title={formatAbsolute(notif.created_at)}
        >
          {relativeTime(notif.created_at)}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {notif.read ? (
          <ActionBtn
            title="Marquer non lu"
            onClick={() => onMarkUnread(notif.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </ActionBtn>
        ) : (
          <ActionBtn
            title="Marquer lu"
            onClick={() => onMarkRead(notif.id)}
          >
            <Check className="h-3.5 w-3.5" />
          </ActionBtn>
        )}

        <ActionBtn
          title={notif.is_starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => onStar(notif.id, !notif.is_starred)}
          className={notif.is_starred ? 'text-amber-400' : ''}
        >
          <Star className={cn('h-3.5 w-3.5', notif.is_starred && 'fill-amber-400')} />
        </ActionBtn>

        <ActionBtn
          title={notif.is_archived ? 'Désarchiver' : 'Archiver'}
          onClick={() => onArchive(notif.id, !notif.is_archived)}
        >
          <Archive className="h-3.5 w-3.5" />
        </ActionBtn>

        {href && (
          <ActionBtn title="Copier le lien" onClick={() => copyLink(href)}>
            <Link2 className="h-3.5 w-3.5" />
          </ActionBtn>
        )}

        <ActionBtn
          title="Supprimer"
          onClick={() => onDelete(notif.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ActionBtn>
      </div>
    </div>
  )
}

function ActionBtn({
  children,
  title,
  onClick,
  className,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        'p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarCounts {
  all: number
  unread: number
  starred: number
  archived: number
}

interface SidebarProps {
  tab: Tab
  setTab: (t: Tab) => void
  typeFilter: TypeFilter
  setTypeFilter: (f: TypeFilter) => void
  search: string
  setSearch: (s: string) => void
  counts: SidebarCounts
}

function Sidebar({ tab, setTab, typeFilter, setTypeFilter, search, setSearch, counts }: SidebarProps) {
  const tabItems: { key: Tab; label: string; emoji: string; count: number }[] = [
    { key: 'all',      label: 'Boîte de réception', emoji: '📬', count: counts.all      },
    { key: 'unread',   label: 'Non lus',             emoji: '🔵', count: counts.unread   },
    { key: 'starred',  label: 'Favoris',             emoji: '⭐', count: counts.starred  },
    { key: 'archived', label: 'Archivés',            emoji: '🗄',  count: counts.archived },
  ]

  const typeItems: { key: TypeFilter; label: string; emoji: string }[] = [
    { key: 'comment', label: 'Commentaires', emoji: '💬' },
    { key: 'like',    label: 'Likes',        emoji: '👍' },
    { key: 'follow',  label: 'Abonnements',  emoji: '👤' },
    { key: 'message', label: 'Messages',     emoji: '✉️'  },
  ]

  return (
    <aside className="w-65 shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <nav className="p-2 flex flex-col gap-0.5">
        {tabItems.map(({ key, label, emoji, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setTypeFilter(null) }}
            className={cn(
              'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
              tab === key && !typeFilter
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
            {count > 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-5 text-center"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Par type</p>
        <div className="h-px bg-border mb-2" />
        <div className="flex flex-col gap-0.5">
          {typeItems.map(({ key, label, emoji }) => (
            <button
              key={key ?? 'null'}
              onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                typeFilter === key
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ─── MobileTabs ──────────────────────────────────────────────────────────────

interface MobileTabsProps {
  tab: Tab
  setTab: (t: Tab) => void
  counts: SidebarCounts
}

function MobileTabs({ tab, setTab, counts }: MobileTabsProps) {
  const items: { key: Tab; label: string; count: number }[] = [
    { key: 'all',      label: 'Inbox',    count: counts.all      },
    { key: 'unread',   label: 'Non lus',  count: counts.unread   },
    { key: 'starred',  label: 'Favoris',  count: counts.starred  },
    { key: 'archived', label: 'Archivés', count: counts.archived },
  ]
  return (
    <div className="flex border-b border-border overflow-x-auto shrink-0">
      {items.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
            tab === key
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
          {count > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── SortDropdown ────────────────────────────────────────────────────────────

function SortDropdown({ sort, setSort }: { sort: SortMode; setSort: (s: SortMode) => void }) {
  const [open, setOpen] = useState(false)
  const options: { key: SortMode; label: string }[] = [
    { key: 'newest',      label: 'Plus récents'      },
    { key: 'oldest',      label: 'Plus anciens'      },
    { key: 'unread-first', label: 'Non lus en premier' },
  ]
  const current = options.find(o => o.key === sort)!

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => setOpen(o => !o)}
      >
        {sort === 'oldest' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
        {current.label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-42.5">
            {options.map(({ key, label }) => (
              <button
                key={key}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2',
                  sort === key && 'font-medium text-foreground',
                )}
                onClick={() => { setSort(key); setOpen(false) }}
              >
                {sort === key && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className={sort !== key ? 'ml-5' : ''}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab labels ──────────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  all:      'Boîte de réception',
  unread:   'Non lus',
  starred:  'Favoris',
  archived: 'Archivés',
}

const EMPTY_MESSAGES: Record<Tab, { title: string; description: string }> = {
  all:      { title: 'Aucune notification',   description: "Tu seras notifié ici lorsque quelqu'un interagit avec tes posts." },
  unread:   { title: 'Tout est lu !',         description: 'Tu es à jour sur toutes tes notifications.' },
  starred:  { title: 'Aucun favori',          description: 'Mets des notifications en favori pour les retrouver facilement.' },
  archived: { title: 'Aucune archive',        description: "Les notifications archivées apparaîtront ici." },
}

// ─── Main page ───────────────────────────────────────────────────────────────

function NotificationsPage() {
  const { isAuthenticated } = useAuthStore()
  const { fetchUnreadCount } = useNotificationStore()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => notificationService.listInbox(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    fetchUnreadCount()
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: invalidate,
  })

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markUnread(id),
    onSuccess: invalidate,
  })

  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      notificationService.star(id, starred),
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      notificationService.archive(id, archived),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: invalidate,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: invalidate,
  })

  const counts = {
    all:      notifs.filter(n => !n.is_archived).length,
    unread:   notifs.filter(n => !n.read && !n.is_archived).length,
    starred:  notifs.filter(n => n.is_starred).length,
    archived: notifs.filter(n => n.is_archived).length,
  }

  const filtered = notifs
    .filter(n => {
      if (tab === 'all')      return !n.is_archived
      if (tab === 'unread')   return !n.read && !n.is_archived
      if (tab === 'starred')  return n.is_starred
      if (tab === 'archived') return n.is_archived
      return true
    })
    .filter(n => {
      if (!typeFilter) return true
      if (typeFilter === 'message') return n.type === 'message_request' || n.type === 'message_accepted'
      if (typeFilter === 'comment') return n.type === 'comment'
      if (typeFilter === 'like')    return n.type === 'like'
      if (typeFilter === 'follow')  return n.type === 'follow'
      return true
    })
    .filter(n => !search ||
      getTitle(n).toLowerCase().includes(search.toLowerCase()) ||
      getBody(n).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'unread-first') {
        if (!a.read && b.read) return -1
        if (a.read && !b.read) return 1
      }
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sort === 'oldest' ? ta - tb : tb - ta
    })

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<Bell className="h-8 w-8" />}
        title="Suis tes notifications"
        description="Connecte-toi pour voir les réponses à tes posts, les votes reçus, les mentions et toute l'activité autour de tes contributions."
      />
    )
  }

  const emptyMsg = EMPTY_MESSAGES[tab]
  const tabLabel = typeFilter
    ? ({ comment: 'Commentaires', like: 'Likes', follow: 'Abonnements', message: 'Messages' } as Record<string, string>)[typeFilter] ?? TAB_LABELS[tab]
    : TAB_LABELS[tab]

  return (
    <div
      className="w-full flex overflow-hidden"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Sidebar desktop */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          tab={tab}
          setTab={setTab}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          search={search}
          setSearch={setSearch}
          counts={counts}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile tabs */}
        <div className="md:hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <MobileTabs tab={tab} setTab={setTab} counts={counts} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="font-semibold text-base min-w-48">{tabLabel}</h1>
            <span className="text-sm text-muted-foreground">
              ({filtered.length})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {counts.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </Button>
            )}
            <SortDropdown sort={sort} setSort={setSort} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-border animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-2.5 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="p-5 rounded-2xl bg-muted">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="w-72">
                <p className="font-medium text-foreground">{emptyMsg.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{emptyMsg.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((notif) => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onMarkUnread={(id) => markUnreadMutation.mutate(id)}
                  onStar={(id, starred) => starMutation.mutate({ id, starred })}
                  onArchive={(id, archived) => archiveMutation.mutate({ id, archived })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
