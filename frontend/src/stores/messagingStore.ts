import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TypingEvent {
  convId:   string
  userId:   string
  username: string
  isTyping: boolean
  at:       number // Date.now()
}

export interface PresenceInfo {
  userId:   string
  isOnline: boolean
  lastSeen?: string
}

export interface ReadReceiptEvent {
  convId:     string
  readerId:   string
  messageIds: string[]
  readAt:     string
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MessagingStore {
  /** Qui est en train de taper, par conversation */
  typingByConv: Record<string, TypingEvent[]>
  /** Statut de présence par userId */
  presences: Record<string, PresenceInfo>
  /** Dernier accusé de lecture reçu (pour déclencher des re-renders) */
  latestReceipt: ReadReceiptEvent | null
  /** Fonction d'envoi WS (initialisée par useWebSocket) */
  wsSend: ((event: { type: string; payload: unknown }) => void) | null

  setTyping: (event: TypingEvent) => void
  setPresence: (info: PresenceInfo) => void
  setLatestReceipt: (event: ReadReceiptEvent) => void
  setWsSend: (fn: (event: { type: string; payload: unknown }) => void) => void
}

export const useMessagingStore = create<MessagingStore>((set) => ({
  typingByConv:  {},
  presences:     {},
  latestReceipt: null,
  wsSend:        null,

  setTyping: (event) =>
    set((state) => {
      const prev = state.typingByConv[event.convId] ?? []
      const filtered = prev.filter((e) => e.userId !== event.userId)
      const next = event.isTyping ? [...filtered, event] : filtered
      return {
        typingByConv: {
          ...state.typingByConv,
          [event.convId]: next,
        },
      }
    }),

  setPresence: (info) =>
    set((state) => ({
      presences: { ...state.presences, [info.userId]: info },
    })),

  setLatestReceipt: (event) => set({ latestReceipt: event }),

  setWsSend: (fn) => set({ wsSend: fn }),
}))
