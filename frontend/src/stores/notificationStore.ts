import { create } from 'zustand'

export type NotifKind = 'reply' | 'vote' | 'mention' | 'resolved' | 'new_post'

export interface Notification {
  id: string
  kind: NotifKind
  title: string
  body: string
  fromUser?: string
  href?: string
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  open:  () => void
  close: () => void
  toggle: () => void
  markAllRead: () => void
  markRead: (id: string) => void
}

const MOCK: Notification[] = [
  {
    id: 'n1',
    kind: 'reply',
    title: 'alex_dev a répondu à ton post',
    body: '"Pourquoi useEffect se déclenche deux fois en React 18 ?"',
    fromUser: 'alex_dev',
    href: '/forum/react/1',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    kind: 'vote',
    title: 'Ton post a reçu 8 votes utiles',
    body: '"TanStack Query vs SWR en 2025 — lequel choisir ?"',
    href: '/forum/react/2',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: 'n3',
    kind: 'mention',
    title: 'thomas_w t\'a mentionné',
    body: 'Dans "Comment structurer les dossiers d\'un projet React"',
    fromUser: 'thomas_w',
    href: '/forum/react/3',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n4',
    kind: 'resolved',
    title: 'Ta question a été marquée comme résolue',
    body: '"Gestion des erreurs dans les Server Components Next.js 14"',
    href: '/forum/react/5',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n5',
    kind: 'new_post',
    title: 'Nouveau post dans TypeScript',
    body: '"Utility types méconnus qui changent la vie" par thomas_w',
    fromUser: 'thomas_w',
    href: '/forum/typescript/12',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'n6',
    kind: 'vote',
    title: 'Ton post a reçu 3 nouveaux votes',
    body: '"Zustand ou Redux Toolkit pour une appli de taille moyenne ?"',
    href: '/forum/react/4',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: MOCK,
  unreadCount: MOCK.filter((n) => !n.read).length,
  isOpen: false,

  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
    })),
}))
