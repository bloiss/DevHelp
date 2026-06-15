import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userService } from '@/services/user.service'
import { messageService } from '@/services/message.service'
import { toast } from '@/stores/toastStore'

interface Props {
  onClose: () => void
}

export function UserSearchDialog({ onClose }: Props) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['user-search', q],
    queryFn: () => userService.searchUsers(q),
    enabled: q.trim().length >= 1,
    staleTime: 10_000,
  })

  const openMutation = useMutation({
    mutationFn: (userId: string) => messageService.openConversation(userId),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      onClose()
      navigate({ to: '/messages', search: { conv: conv.id } })
    },
    onError: () => toast.error('Impossible d\'ouvrir la conversation'),
  })

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
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              autoFocus
              placeholder="Rechercher un utilisateur…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 bg-transparent"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {q.trim().length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tape un nom d'utilisateur…
              </p>
            ) : results.length === 0 && !isFetching ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun résultat pour « {q} »
              </p>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => openMutation.mutate(user.id)}
                  disabled={openMutation.isPending}
                >
                  <Avatar user={user} size="md" className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{user.username}</p>
                    {user.role !== 'user' && (
                      <p className="text-xs text-muted-foreground">
                        {user.role === 'moderator' ? 'Modérateur' : 'Admin'}
                      </p>
                    )}
                  </div>
                  {openMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
