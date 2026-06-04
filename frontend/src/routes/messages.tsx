import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Send, ArrowLeft, MessageSquare, CheckCheck,
  Loader2, AlertCircle, Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { AuthWall } from '@/components/shared/AuthWall'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'
import { messageService, type ApiConversation, type ApiMessage } from '@/services/message.service'
import { UserSearchDialog } from '@/components/messages/UserSearchDialog'
import { cn, formatRelativeDate } from '@/lib/utils'

export const Route = createFileRoute('/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    conv: typeof search.conv === 'string' ? search.conv : undefined,
  }),
  component: MessagesPage,
})

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isSameGroup(a: ApiMessage, b: ApiMessage): boolean {
  return (
    a.sender_id === b.sender_id &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60 * 1000
  )
}

// ─── ConvItem ─────────────────────────────────────────────────────────────────

function ConvItem({ conv, selected, onClick }: {
  conv: ApiConversation
  selected: boolean
  onClick: () => void
}) {
  const isRequest = conv.status === 'request'

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
        selected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-muted/60',
      )}
    >
      <div className="relative shrink-0">
        <Avatar user={conv.other_user} size="md" />
        {conv.unread_count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: 'var(--gold)', color: 'var(--primary-foreground)' }}
          >
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-semibold' : 'font-medium')}>
            {conv.other_user.username}
          </span>
          {conv.last_message && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatRelativeDate(conv.last_message.created_at)}
            </span>
          )}
        </div>
        <p className={cn('text-xs truncate mt-0.5', conv.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          {isRequest
            ? <span className="italic" style={{ color: 'var(--gold)' }}>Demande de conversation</span>
            : (conv.last_message?.content ?? 'Aucun message')}
        </p>
      </div>
    </motion.button>
  )
}

// ─── Skeleton conv ────────────────────────────────────────────────────────────

function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  showTime,
  isPending,
  isError,
}: {
  msg: ApiMessage
  isMe: boolean
  isFirst: boolean   // premier d'un groupe
  isLast: boolean    // dernier d'un groupe
  showTime: boolean
  isPending?: boolean
  isError?: boolean
}) {
  const br = isMe
    ? cn('rounded-2xl rounded-br-sm', !isLast && 'rounded-br-2xl', isFirst && isLast && 'rounded-2xl rounded-br-sm')
    : cn('rounded-2xl rounded-bl-sm', !isLast && 'rounded-bl-2xl', isFirst && isLast && 'rounded-2xl rounded-bl-sm')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row', !isLast && 'mb-0.5')}
    >
      {/* Avatar — only on last of a received group */}
      <div className="w-7 shrink-0">
        {!isMe && isLast && (
          <Avatar user={msg.sender} size="sm" className="h-7 w-7" />
        )}
      </div>

      <div className={cn('flex flex-col max-w-[72%] sm:max-w-[60%]', isMe ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3.5 py-2 text-sm leading-relaxed break-words',
            br,
            isMe
              ? 'text-primary-foreground'
              : 'bg-muted text-foreground',
            isPending && 'opacity-60',
            isError && 'bg-destructive/20 text-destructive',
          )}
          style={isMe && !isError ? { background: 'var(--gold)' } : undefined}
        >
          {msg.content}
        </div>

        {/* Timestamp + status */}
        {(showTime || isPending || isError) && (
          <div className={cn('flex items-center gap-1 mt-1 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[10px] text-muted-foreground/60">
              {isPending ? 'Envoi…' : isError ? 'Erreur' : formatMessageTime(msg.created_at)}
            </span>
            {isMe && !isPending && !isError && (
              <CheckCheck className="h-3 w-3 text-muted-foreground/50" />
            )}
            {isError && <AlertCircle className="h-3 w-3 text-destructive" />}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── DateSeparator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (d.toDateString() === today.toDateString()) label = "Aujourd'hui"
  else if (d.toDateString() === yesterday.toDateString()) label = 'Hier'
  else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

function MessagesPage() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { conv } = useSearch({ from: '/messages' })
  const [selectedId, setSelectedId] = useState<string | null>(conv ?? null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingMsgs, setPendingMsgs] = useState<ApiMessage[]>([])

  const { data: convs = [], isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.listConversations,
    enabled: isAuthenticated,
    refetchInterval: false,
  })

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => messageService.getMessages(selectedId!),
    enabled: isAuthenticated && !!selectedId,
    refetchInterval: false,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => messageService.sendMessage(selectedId!, content),
    onMutate: (content) => {
      // Message optimiste local
      const optimistic: ApiMessage = {
        id: `pending-${Date.now()}`,
        conversation_id: selectedId!,
        sender_id: user!.id,
        content,
        read: false,
        created_at: new Date().toISOString(),
        sender: user!,
      }
      setPendingMsgs((p) => [...p, optimistic])
      return { optimisticId: optimistic.id }
    },
    onSuccess: (_, __, ctx) => {
      setPendingMsgs((p) => p.filter((m) => m.id !== ctx?.optimisticId))
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_, __, ctx) => {
      setPendingMsgs((p) =>
        p.map((m) => m.id === ctx?.optimisticId ? { ...m, id: `error-${m.id}` } : m),
      )
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (convId: string) => messageService.acceptConversation(convId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  })

  // Clear pending when real messages arrive
  useEffect(() => {
    setPendingMsgs([])
  }, [messages.length])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, pendingMsgs.length])

  // Focus input on conv change
  useEffect(() => {
    if (selectedId) setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedId])

  const openConv = useCallback((id: string) => {
    setSelectedId(id)
    setPendingMsgs([])
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }), 600)
  }, [queryClient])

  const handleSend = useCallback(() => {
    const content = input.trim()
    if (!content || !selectedId || sendMutation.isPending) return
    setInput('')
    sendMutation.mutate(content)
  }, [input, selectedId, sendMutation])

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<MessageSquare className="h-8 w-8" />}
        title="Accède à tes messages"
        description="Connecte-toi pour retrouver tes conversations avec la communauté."
      />
    )
  }

  const selected = convs.find((c) => c.id === selectedId) ?? null
  const filteredConvs = search
    ? convs.filter((c) => c.other_user.username.toLowerCase().includes(search.toLowerCase()))
    : convs

  // Fusionner messages réels + optimistes
  const allMessages: (ApiMessage & { _pending?: boolean; _error?: boolean })[] = [
    ...messages,
    ...pendingMsgs.map((m) => ({
      ...m,
      _pending: !m.id.startsWith('error-'),
      _error: m.id.startsWith('error-'),
    })),
  ]

  return (
    <div
      className="flex overflow-hidden border-t border-border"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* ── Sidebar conversations ───────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-background shrink-0',
          'w-full md:w-72 lg:w-80',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        {/* Dialog recherche utilisateur */}
        {showUserSearch && <UserSearchDialog onClose={() => setShowUserSearch(false)} />}

        {/* Header sidebar */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold">Messages</h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Nouveau message"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border-0 outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {convsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Aucun résultat' : 'Aucune conversation'}
              </p>
              {!search && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Commence depuis le profil d'un membre
                </p>
              )}
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={conv.id === selectedId}
                onClick={() => openConv(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Thread ──────────────────────────────────────────────────── */}
      <div className={cn('flex-1 flex flex-col min-w-0 bg-background', selectedId ? 'flex' : 'hidden md:flex')}>

        {!selected ? (
          /* Empty state desktop */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-sm">Sélectionne une conversation</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Choisis une conversation dans la liste pour commencer à discuter.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header thread ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
              <button
                className="md:hidden p-1.5 rounded-md hover:bg-accent transition-colors -ml-1"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate({ to: '/profile/$username', params: { username: selected.other_user.username } })}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <Avatar user={selected.other_user} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-semibold leading-none">{selected.other_user.username}</p>
                </div>
              </button>

              {selected.status === 'request' && selected.request_sender_id !== user?.id && (
                <Button
                  size="sm"
                  className="ml-auto h-7 text-xs rounded-full gap-1"
                  onClick={() => acceptMutation.mutate(selected.id)}
                  disabled={acceptMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Accepter
                </Button>
              )}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Aucun message</p>
                    <p className="text-xs text-muted-foreground">Commence la conversation !</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  <div className="flex flex-col gap-0.5">
                    {allMessages.map((msg, i) => {
                      const prev = allMessages[i - 1]
                      const next = allMessages[i + 1]
                      const isMe = msg.sender_id === user?.id
                      const isFirst = !prev || !isSameGroup(prev, msg)
                      const isLast  = !next || !isSameGroup(msg, next)
                      const showTime = isLast
                      const differentDay = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()

                      return (
                        <div key={msg.id}>
                          {differentDay && <DateSeparator date={msg.created_at} />}
                          {isFirst && !isMe && (
                            <p className="text-[11px] text-muted-foreground ml-9 mb-0.5 mt-2">
                              {msg.sender.username}
                            </p>
                          )}
                          <MessageBubble
                            msg={msg}
                            isMe={isMe}
                            isFirst={isFirst}
                            isLast={isLast}
                            showTime={showTime}
                            isPending={(msg as ApiMessage & { _pending?: boolean })._pending}
                            isError={(msg as ApiMessage & { _error?: boolean })._error}
                          />
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* ── Bannière demande ── */}
            {selected.status === 'request' && selected.request_sender_id !== user?.id && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border bg-muted/30">
                Cette personne t'a envoyé une demande de conversation.
              </div>
            )}

            {/* ── Input ── */}
            <div className="px-4 py-3 border-t border-border bg-background shrink-0">
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Écrire un message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={sendMutation.isPending && pendingMsgs.length > 0}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    'p-1.5 rounded-full transition-all duration-150',
                    input.trim()
                      ? 'text-primary-foreground scale-100'
                      : 'text-muted-foreground scale-90 opacity-50',
                  )}
                  style={input.trim() ? { background: 'var(--gold)' } : undefined}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                Entrée pour envoyer
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
