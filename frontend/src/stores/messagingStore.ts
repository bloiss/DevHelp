import { create } from 'zustand'

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

interface MessagingStore {
  typingByConv: Record<string, TypingEvent[]>
  presences: Record<string, PresenceInfo>
  latestReceipt: ReadReceiptEvent | null
  activeConvId: string | null
  wsSend: ((event: { type: string; payload: unknown }) => void) | null

  setTyping: (event: TypingEvent) => void
  setPresence: (info: PresenceInfo) => void
  setLatestReceipt: (event: ReadReceiptEvent) => void
  setActiveConvId: (id: string | null) => void
  setWsSend: (fn: (event: { type: string; payload: unknown }) => void) => void
}

export const useMessagingStore = create<MessagingStore>((set) => ({
  typingByConv:  {},
  presences:     {},
  latestReceipt: null,
  activeConvId:  null,
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

  setActiveConvId: (id) => set({ activeConvId: id }),

  setWsSend: (fn) => set({ wsSend: fn }),
}))
