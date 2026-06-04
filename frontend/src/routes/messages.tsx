import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, MessageSquare, CheckCheck, Clock } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/EmptyState'
import { AuthWall } from '@/components/shared/AuthWall'
import { useAuthStore } from '@/stores/authStore'
import { messageService, type ApiConversation, type ApiMessage } from '@/services/message.service'
import { cn, formatRelativeDate } from '@/lib/utils'

export const Route = createFileRoute('/messages')({
  component: MessagesPage,
})

// ─── Composants internes ──────────────────────────────────────────

function ConvItem({
  conv,
  selected,
  onClick,
}: {
  conv: ApiConversation
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/50 transition-colors',
        selected && 'bg-accent',
      )}
    >
      <Avatar user={conv.other_user} size="md" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{conv.other_user.username}</span>
          {conv.last_message && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeDate(conv.last_message.created_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conv.status === 'request' ? (
            <span className="text-primary italic">Demande de conversation</span>
          ) : (
            conv.last_message?.content ?? 'Aucun message'
          )}
        </p>
      </div>
      {conv.unread_count > 0 && (
        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 font-medium">
          {conv.unread_count}
        </span>
      )}
    </button>
  )
}

function MessageBubble({ msg, isMe }: { msg: ApiMessage; isMe: boolean }) {
  return (
    <div className={cn('flex gap-2 max-w-[75%]', isMe ? 'ml-auto flex-row-reverse' : '')}>
      {!isMe && (
        <Avatar user={msg.sender} size="sm" className="h-7 w-7 shrink-0 self-end" />
      )}
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isMe
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {msg.content}
        <span className={cn(
          'block text-[10px] mt-1 opacity-60 text-right',
          isMe ? 'text-primary-foreground' : 'text-muted-foreground',
        )}>
          {formatRelativeDate(msg.created_at)}
        </span>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────

function MessagesPage() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setInput('')
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (convId: string) => messageService.acceptConversation(convId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

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

  // Scroll to bottom quand les messages changent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Invalide les convs quand on ouvre une conversation (marque comme lu côté serveur)
  function openConv(id: string) {
    setSelectedId(id)
    // Après ouverture, re-fetch pour mettre à jour unread_count
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }, 500)
  }

  function handleSend() {
    const content = input.trim()
    if (!content || !selectedId || sendMutation.isPending) return
    sendMutation.mutate(content)
  }

  return (
    <div className="h-full flex overflow-hidden border-t border-border">

      {/* ── Liste des conversations ── */}
      <aside
        className={cn(
          'w-full md:w-80 md:flex flex-col border-r border-border shrink-0',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>

        {convsLoading ? (
          <div className="flex-1 flex flex-col divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : convs.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="Aucune conversation"
            description="Commence une discussion depuis le profil d'un membre."
          />
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {convs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={conv.id === selectedId}
                onClick={() => openConv(conv.id)}
              />
            ))}
          </div>
        )}
      </aside>

      {/* ── Thread ── */}
      <div
        className={cn(
          'flex-1 flex-col min-w-0',
          selectedId ? 'flex' : 'hidden md:flex',
        )}
      >
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageSquare className="h-10 w-10" />}
              title="Sélectionne une conversation"
              description="Choisis une conversation à gauche pour commencer."
            />
          </div>
        ) : (
          <>
            {/* Header thread */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <button
                className="md:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate({ to: '/profile/$username', params: { username: selected.other_user.username } })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar user={selected.other_user} size="sm" />
                <span className="font-semibold text-sm">{selected.other_user.username}</span>
              </button>

              {selected.status === 'request' && selected.request_sender_id !== user?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-xs rounded-full"
                  onClick={() => acceptMutation.mutate(selected.id)}
                  disabled={acceptMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Accepter
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Aucun message. Commence la conversation !
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.sender_id === user?.id}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Bannière demande de conversation */}
            {selected.status === 'request' && selected.request_sender_id !== user?.id && (
              <div className="px-4 py-2 bg-muted/50 border-t border-border text-xs text-muted-foreground text-center">
                Cette personne t'a envoyé une demande de conversation.
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <Input
                placeholder="Écrire un message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1"
                disabled={sendMutation.isPending}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
