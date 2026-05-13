import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/EmptyState'
import { AuthWall } from '@/components/shared/AuthWall'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { User } from '@/types/user'

export const Route = createFileRoute('/messages')({
  component: MessagesPage,
})

// ─── Types mock ──────────────────────────────────────────────────

interface ConvPreview {
  id: string
  other: Pick<User, 'id' | 'username' | 'avatar_url'>
  lastMessage: string
  lastAt: string
  unread: number
}

interface Msg {
  id: string
  convId: string
  senderId: string
  content: string
  createdAt: string
}

// ─── Données mock ─────────────────────────────────────────────────

const ME = 'me'

const MOCK_CONVS: ConvPreview[] = [
  {
    id: 'c1',
    other: { id: 'u3', username: 'thomas_w' },
    lastMessage: "Bonne idée, on en parle à la prochaine réunion ?",
    lastAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unread: 0,
  },
  {
    id: 'c2',
    other: { id: 'u2', username: 'marie_js' },
    lastMessage: "Super présentation hier, vraiment !",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unread: 2,
  },
  {
    id: 'c3',
    other: { id: 'u1', username: 'alex_dev' },
    lastMessage: "Merci pour le retour sur mon post 🙏",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: 0,
  },
]

const MOCK_MESSAGES: Record<string, Msg[]> = {
  c1: [
    {
      id: 'm1', convId: 'c1', senderId: 'u3',
      content: "Salut ! Tu as vu le nouveau pattern de routing avec TanStack ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'm2', convId: 'c1', senderId: ME,
      content: "Oui ! C'est vraiment propre comparé à ce qu'on faisait avant.",
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'm3', convId: 'c1', senderId: 'u3',
      content: "Je vais l'utiliser sur le projet DevHelp direct.",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm4', convId: 'c1', senderId: ME,
      content: "Bonne idée, on en parle à la prochaine réunion ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
  c2: [
    {
      id: 'm5', convId: 'c2', senderId: 'u2',
      content: "Hey ! Super présentation hier, vraiment !",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'm6', convId: 'c2', senderId: 'u2',
      content: "T'as pensé à publier les slides quelque part ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ],
  c3: [
    {
      id: 'm7', convId: 'c3', senderId: ME,
      content: "Bon post sur useEffect, j'ai eu le même problème la semaine dernière.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    },
    {
      id: 'm8', convId: 'c3', senderId: 'u1',
      content: "Merci pour le retour sur mon post 🙏",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
}

// ─── Composants internes ──────────────────────────────────────────

function ConvItem({
  conv,
  selected,
  onClick,
}: {
  conv: ConvPreview
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
      <Avatar user={conv.other} size="md" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{conv.other.username}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeDate(conv.lastAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conv.lastMessage}
        </p>
      </div>
      {conv.unread > 0 && (
        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 font-medium">
          {conv.unread}
        </span>
      )}
    </button>
  )
}

function MessageBubble({ msg, isMe }: { msg: Msg; isMe: boolean }) {
  return (
    <div className={cn('flex gap-2 max-w-[75%]', isMe ? 'ml-auto flex-row-reverse' : '')}>
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isMe
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {msg.content}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────

function MessagesPage() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <AuthWall
        icon={<MessageSquare className="h-8 w-8" />}
        title="Accède à tes messages"
        description="Connecte-toi pour retrouver tes conversations avec la communauté et échanger en privé avec d'autres développeurs."
      />
    )
  }
  const [convs, setConvs] = useState<ConvPreview[]>(MOCK_CONVS)
  const [messages, setMessages] = useState<Record<string, Msg[]>>(MOCK_MESSAGES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = convs.find((c) => c.id === selectedId) ?? null
  const thread = selectedId ? (messages[selectedId] ?? []) : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length])

  function openConv(id: string) {
    setSelectedId(id)
    setConvs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    )
  }

  function sendMessage() {
    if (!input.trim() || !selectedId) return
    const newMsg: Msg = {
      id: `m-${Date.now()}`,
      convId: selectedId,
      senderId: ME,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMsg],
    }))
    setConvs((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, lastMessage: newMsg.content, lastAt: newMsg.createdAt }
          : c,
      ),
    )
    setInput('')
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

        {convs.length === 0 ? (
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
              <Avatar user={selected.other} size="sm" />
              <span className="font-semibold text-sm">{selected.other.username}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {thread.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.senderId === ME}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <Input
                placeholder="Écrire un message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim()}
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
