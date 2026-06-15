import { createFileRoute, useNavigate, useSearch, Link } from '@tanstack/react-router'
import {
  useState, useRef, useEffect, useCallback,
  type KeyboardEvent, type ChangeEvent,
} from 'react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, ArrowLeft, MessageSquare, CheckCheck, Check,
  Loader2, Search, Image, Share2, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { AuthWall } from '@/components/shared/AuthWall'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '@/stores/messagingStore'
import { messageService, type ApiConversation, type ApiMessage } from '@/services/message.service'
import { postService } from '@/services/post.service'
import type { Post } from '@/types/post'
import { UserSearchDialog } from '@/components/messages/UserSearchDialog'
import { cn, formatRelativeDate } from '@/lib/utils'
import { toast } from '@/stores/toastStore'

export const Route = createFileRoute('/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    conv: typeof search.conv === 'string' ? search.conv : undefined,
  }),
  component: MessagesPage,
})

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isSameGroup(a: ApiMessage, b: ApiMessage) {
  return (
    a.sender_id === b.sender_id &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60 * 1000
  )
}

function useTypingDebounce(convId: string | null, enabled: boolean) {
  const { wsSend } = useMessagingStore()
  const typingRef   = useRef(false)
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onKeyPress = useCallback(() => {
    if (!convId || !enabled || !wsSend) return
    if (!typingRef.current) {
      typingRef.current = true
      wsSend({ type: 'typing_start', payload: { conv_id: convId } })
    }
    if (stopTimeout.current) clearTimeout(stopTimeout.current)
    stopTimeout.current = setTimeout(() => {
      typingRef.current = false
      wsSend({ type: 'typing_stop', payload: { conv_id: convId } })
    }, 2500)
  }, [convId, enabled, wsSend])

  const stopTyping = useCallback(() => {
    if (stopTimeout.current) clearTimeout(stopTimeout.current)
    if (typingRef.current && wsSend && convId) {
      typingRef.current = false
      wsSend({ type: 'typing_stop', payload: { conv_id: convId } })
    }
  }, [convId, wsSend])

  return { onKeyPress, stopTyping }
}

function ConvItem({ conv, selected, onClick }: {
  conv: ApiConversation; selected: boolean; onClick: () => void
}) {
  const { presences } = useMessagingStore()
  const isOnline  = presences[conv.other_user.id]?.isOnline ?? false
  const isRequest = conv.status === 'request'

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60',
      )}
    >
      <div className="relative shrink-0">
        <Avatar user={conv.other_user} size="md" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
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
            : (conv.last_message?.content || (conv.last_message?.attachment_url ? '📷 Image' : 'Aucun message'))}
        </p>
      </div>
    </motion.button>
  )
}

function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  let label: string
  if (d.toDateString() === today.toDateString())      label = "Aujourd'hui"
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

function ReadReceipt({ msg, isMe }: { msg: ApiMessage; isMe: boolean }) {
  if (!isMe) return null
  const readEntry = msg.reads?.[0]
  if (msg.status === 'read' && readEntry) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-sky-400">
        <CheckCheck className="h-3 w-3" />
        <span>{formatTime(readEntry.read_at)}</span>
      </span>
    )
  }
  if (msg.status === 'delivered') {
    return <CheckCheck className="h-3 w-3 text-muted-foreground/50" />
  }
  return <Check className="h-3 w-3 text-muted-foreground/40" />
}

function SharedPostCard({ post }: { post: NonNullable<ApiMessage['shared_post']> }) {
  const slug = post.category?.slug
  const inner = (
    <>
      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">
        Post partagé
      </p>
      <p className="text-sm font-semibold line-clamp-2 leading-snug">{post.title}</p>
      <p className="text-xs text-muted-foreground mt-1">par {post.author?.username}</p>
    </>
  )
  if (!slug) {
    return (
      <div className="block mt-1 rounded-xl border border-border/60 bg-background/60 p-3 text-left max-w-70">
        {inner}
      </div>
    )
  }
  return (
    <Link
      to="/forum/$category/$postId"
      params={{ category: slug, postId: post.id }}
      className="block mt-1 rounded-xl border border-border/60 bg-background/60 p-3 text-left hover:bg-muted/40 transition-colors max-w-70"
      onClick={(e) => e.stopPropagation()}
    >
      {inner}
    </Link>
  )
}

function MessageBubble({
  msg, isMe, isFirst, isLast, isPending, isError,
}: {
  msg: ApiMessage & { _pending?: boolean; _error?: boolean }
  isMe: boolean; isFirst: boolean; isLast: boolean
  isPending?: boolean; isError?: boolean
}) {
  const br = isMe
    ? cn('rounded-2xl rounded-br-sm', !isLast && 'rounded-br-2xl', isFirst && isLast && 'rounded-2xl rounded-br-sm')
    : cn('rounded-2xl rounded-bl-sm', !isLast && 'rounded-bl-2xl', isFirst && isLast && 'rounded-2xl rounded-bl-sm')

  const isDeleted = msg.is_deleted

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row', !isLast && 'mb-0.5')}
    >
      <div className="w-7 shrink-0">
        {!isMe && isLast && <Avatar user={msg.sender} size="sm" className="h-7 w-7" />}
      </div>

      <div className={cn('flex flex-col max-w-[72%] sm:max-w-[60%]', isMe ? 'items-end' : 'items-start')}>
        {msg.attachment_url && msg.attachment_type === 'image' && !isDeleted && (
          <img
            src={msg.attachment_url}
            alt="image"
            className={cn('rounded-xl max-w-60 max-h-75 object-cover mb-1', br)}
          />
        )}

        {(msg.content || isDeleted) && (
          <div
            className={cn(
              'px-3.5 py-2 text-sm leading-relaxed wrap-break-word',
              br,
              isMe ? 'text-primary-foreground' : 'bg-muted text-foreground',
              isPending && 'opacity-60',
              isError && 'bg-destructive/20 text-destructive border border-destructive/30',
              isDeleted && 'italic text-muted-foreground bg-muted/50',
            )}
            style={isMe && !isError && !isDeleted ? { background: 'var(--gold)' } : undefined}
          >
            {isDeleted ? 'Message supprimé' : msg.content}
          </div>
        )}

        {msg.shared_post && !isDeleted && <SharedPostCard post={msg.shared_post} />}

        {isLast && (
          <div className={cn('flex items-center gap-1 mt-1 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[10px] text-muted-foreground/60">
              {isPending ? 'Envoi…' : isError ? 'Erreur' : formatTime(msg.created_at)}
            </span>
            {isMe && !isPending && !isError && <ReadReceipt msg={msg} isMe={isMe} />}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 shrink-0" />
      <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

function PostShareDialog({
  onSelect,
  onClose,
}: {
  onSelect: (post: Post) => void
  onClose:  () => void
}) {
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['posts-share'],
    queryFn:  () => postService.list({ per_page: 30 }),
  })

  const posts = data?.data ?? []
  const filtered = q.trim()
    ? posts.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
    : posts

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              placeholder="Rechercher un post…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {filtered.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {q ? `Aucun résultat pour « ${q} »` : 'Aucun post disponible'}
              </p>
            ) : (
              filtered.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onSelect(post)}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <p className="text-sm font-semibold line-clamp-1">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    par {post.author.username} · {post.category?.name}
                  </p>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function MessagesPage() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient   = useQueryClient()
  const navigate      = useNavigate()
  const { conv }      = useSearch({ from: '/messages' })
  const { wsSend, typingByConv, presences, setActiveConvId } = useMessagingStore()

  const [selectedId,     setSelectedId]     = useState<string | null>(conv ?? null)
  const [input,          setInput]          = useState('')
  const [search,         setSearch]         = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showPostShare,  setShowPostShare]  = useState(false)
  const [pendingMsgs,    setPendingMsgs]    = useState<(ApiMessage & { _pending?: boolean; _error?: boolean })[]>([])

  const bottomRef       = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const scrollRef       = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)
  const isFirstLoad     = useRef(true)

  const { onKeyPress: onTypingKeyPress, stopTyping } = useTypingDebounce(selectedId, isAuthenticated)

  const { data: convs = [], isLoading: convsLoading } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.listConversations(),
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
    select: (d) => d.pages[0] ?? [],
    enabled: isAuthenticated,
  }) as { data: ApiConversation[]; isLoading: boolean }

  const {
    data:                 messagesData,
    fetchNextPage:        loadOlderMessages,
    hasNextPage:          hasOlderMessages,
    isFetchingNextPage:   isLoadingOlder,
    isLoading:            messagesLoading,
  } = useInfiniteQuery({
    queryKey:       ['messages', selectedId],
    queryFn:        ({ pageParam }) =>
      messageService.getMessages(selectedId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (firstPage) =>
      firstPage.has_more && firstPage.data.length > 0
        ? firstPage.data[0].created_at
        : undefined,
    enabled: !!selectedId && isAuthenticated,
  })

  const serverMessages: ApiMessage[] = messagesData
    ? [...messagesData.pages].reverse().flatMap((p) => p.data)
    : []

  const serverIds = new Set(serverMessages.map((m) => m.id))
  const allMessages = [
    ...serverMessages,
    ...pendingMsgs.filter((m) => !serverIds.has(m.id)),
  ]

  const typingUsers = selectedId ? (typingByConv[selectedId] ?? []) : []
  const activeTyping = typingUsers.filter((t) => t.isTyping && Date.now() - t.at < 3500)

  const selectedConv = convs.find((c) => c.id === selectedId) ?? null
  const otherUser    = selectedConv?.other_user
  const otherPresence = otherUser ? presences[otherUser.id] : undefined

  const sendMutation = useMutation({
    mutationFn: (content: string) => messageService.sendMessage(selectedId!, content),
    onMutate: (content) => {
      const optimistic: ApiMessage & { _pending: boolean } = {
        id:              `pending-${Date.now()}`,
        conversation_id: selectedId!,
        sender_id:       user!.id,
        content,
        status:          'sent',
        is_deleted:      false,
        created_at:      new Date().toISOString(),
        sender:          user!,
        reads:           [],
        _pending:        true,
      }
      setPendingMsgs((p) => [...p, optimistic])
      return { optimisticId: optimistic.id }
    },
    onSuccess: (serverMsg, _, ctx) => {
      setPendingMsgs((p) => p.filter((m) => m.id !== ctx?.optimisticId))
      queryClient.setQueryData(['messages', selectedId], (old: any) => {
        if (!old) return old
        const alreadyExists = old.pages.some((page: any) =>
          page.data.some((m: any) => m.id === serverMsg.id),
        )
        if (alreadyExists) return old
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => {
            if (i !== 0) return page
            return { ...page, data: [...page.data, serverMsg] }
          }),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_, __, ctx) => {
      setPendingMsgs((p) =>
        p.map((m) => m.id === ctx?.optimisticId ? { ...m, _pending: false, _error: true } : m),
      )
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (convId: string) => messageService.acceptConversation(convId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const shareMutation = useMutation({
    mutationFn: (postId: string) =>
      messageService.sendMessage(selectedId!, '', undefined, undefined, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Impossible de partager ce post'),
  })

  const handleSharePost = useCallback((post: Post) => {
    setShowPostShare(false)
    shareMutation.mutate(post.id)
  }, [shareMutation])

  useEffect(() => {
    if (!selectedId || !wsSend) return
    wsSend({ type: 'presence_update', payload: { conv_id: selectedId } })
    wsSend({ type: 'mark_read',       payload: { conv_id: selectedId } })
    messageService.markRead(selectedId).catch(() => {})
    return () => {
      wsSend({ type: 'presence_update', payload: { conv_id: null } })
      stopTyping()
    }
  }, [selectedId, wsSend, stopTyping])

  useEffect(() => {
    if (!scrollRef.current) return
    if (isFirstLoad.current && serverMessages.length > 0) {
      isFirstLoad.current = false
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      return
    }
    const el = scrollRef.current
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom || pendingMsgs.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length])

  useEffect(() => {
    setActiveConvId(selectedId)
    return () => setActiveConvId(null)
  }, [selectedId, setActiveConvId])

  useEffect(() => {
    isFirstLoad.current = true
    setPendingMsgs([])
    if (selectedId) setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedId])

  useEffect(() => {
    if (prevScrollHeight.current > 0 && scrollRef.current) {
      const diff = scrollRef.current.scrollHeight - prevScrollHeight.current
      scrollRef.current.scrollTop = diff
      prevScrollHeight.current = 0
    }
  }, [messagesData?.pages.length])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasOlderMessages || isLoadingOlder) return
    if (scrollRef.current.scrollTop < 80) {
      prevScrollHeight.current = scrollRef.current.scrollHeight
      loadOlderMessages()
    }
  }, [hasOlderMessages, isLoadingOlder, loadOlderMessages])

  const openConv = useCallback((id: string) => {
    setSelectedId(id)
    setPendingMsgs([])
    navigate({ to: '/messages', search: { conv: id } })
  }, [navigate])

  const handleSend = useCallback(() => {
    const content = input.trim()
    if (!content || !selectedId || sendMutation.isPending) return
    setInput('')
    stopTyping()
    sendMutation.mutate(content)
  }, [input, selectedId, sendMutation, stopTyping])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    onTypingKeyPress()
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<MessageSquare className="h-8 w-8" />}
        title="Accède à tes messages"
        description="Connecte-toi pour retrouver tes conversations."
      />
    )
  }

  const filteredConvs = search
    ? convs.filter((c) => c.other_user.username.toLowerCase().includes(search.toLowerCase()))
    : convs

  return (
    <div className="flex overflow-hidden border-t border-border" style={{ height: 'calc(100vh - 56px)' }}>

      <aside className={cn(
        'flex flex-col border-r border-border bg-background shrink-0 w-full md:w-72 lg:w-80',
        selectedId ? 'hidden md:flex' : 'flex',
      )}>
        {showUserSearch && <UserSearchDialog onClose={() => setShowUserSearch(false)} />}

        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold">Messages</h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
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

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {convsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
              {!search && <p className="text-xs text-muted-foreground/60 mt-1">Commence depuis le profil d'un membre</p>}
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem key={conv.id} conv={conv} selected={conv.id === selectedId} onClick={() => openConv(conv.id)} />
            ))
          )}
        </div>
      </aside>

      <div className={cn('flex-1 flex flex-col min-w-0 bg-background', selectedId ? 'flex' : 'hidden md:flex')}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-sm">Sélectionne une conversation</p>
              <p className="text-xs text-muted-foreground max-w-50">
                Choisis une conversation dans la liste pour commencer à discuter.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
              <button
                className="md:hidden p-1.5 rounded-md hover:bg-accent -ml-1"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate({ to: '/profile/$username', params: { username: selectedConv.other_user.username } })}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <Avatar user={selectedConv.other_user} size="sm" />
                  {otherPresence?.isOnline && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-none">{selectedConv.other_user.username}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {otherPresence?.isOnline
                      ? 'En ligne'
                      : otherPresence?.lastSeen
                        ? `Vu ${formatRelativeDate(otherPresence.lastSeen)}`
                        : ''}
                  </p>
                </div>
              </button>

              {selectedConv.status === 'request' && selectedConv.request_sender_id !== user?.id && (
                <Button
                  size="sm"
                  className="ml-auto h-7 text-xs rounded-full gap-1"
                  onClick={() => acceptMutation.mutate(selectedConv.id)}
                  disabled={acceptMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Accepter
                </Button>
              )}
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              {isLoadingOlder && (
                <div className="flex justify-center py-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {hasOlderMessages && !isLoadingOlder && (
                <div className="flex justify-center mb-2">
                  <button
                    onClick={() => {
                      prevScrollHeight.current = scrollRef.current?.scrollHeight ?? 0
                      loadOlderMessages()
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    Charger les messages précédents
                  </button>
                </div>
              )}

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
                      const isMe    = msg.sender_id === user?.id
                      const isFirst = !prev || !isSameGroup(prev, msg)
                      const isLast  = !next || !isSameGroup(msg, next)
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
                            isPending={(msg as any)._pending}
                            isError={(msg as any)._error}
                          />
                        </div>
                      )
                    })}

                    {activeTyping.length > 0 && (
                      <div className="mt-1">
                        <p className="text-[11px] text-muted-foreground ml-9 mb-0.5">
                          {activeTyping[0].username} est en train de taper…
                        </p>
                        <TypingBubble />
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </AnimatePresence>
              )}
            </div>

            {selectedConv.status === 'request' && selectedConv.request_sender_id !== user?.id && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border bg-muted/30">
                Cette personne t'a envoyé une demande de conversation.
              </div>
            )}

            {showPostShare && (
              <PostShareDialog
                onSelect={handleSharePost}
                onClose={() => setShowPostShare(false)}
              />
            )}

            <div className="px-4 py-3 border-t border-border bg-background shrink-0">
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2">

                <button
                  onClick={() => setShowPostShare(true)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors shrink-0"
                  title="Partager un post"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => toast.info('Bientôt disponible', { description: "L'upload d'images arrive prochainement." })}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors shrink-0"
                  title="Envoyer une image"
                >
                  <Image className="h-4 w-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Écrire un message…"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  disabled={selectedConv.status === 'request' && selectedConv.request_sender_id === user?.id && false}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    'p-1.5 rounded-full transition-all duration-150 shrink-0',
                    input.trim() ? 'text-primary-foreground scale-100' : 'text-muted-foreground scale-90 opacity-50',
                  )}
                  style={input.trim() ? { background: 'var(--gold)' } : undefined}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                Entrée pour envoyer · Les messages sont chiffrés
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
