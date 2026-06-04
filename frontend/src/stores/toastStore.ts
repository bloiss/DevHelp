import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id:           string
  type:         ToastType
  title:        string
  description?: string
  duration:     number
}

interface ToastState {
  toasts: Toast[]
  add:    (t: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => set((s) => {
    // Déduplique : si un toast avec le même titre existe déjà, on ignore
    if (s.toasts.some((existing) => existing.title === t.title && existing.type === t.type)) {
      return s
    }
    return {
      toasts: [
        ...s.toasts.slice(-3),
        { ...t, id: crypto.randomUUID() },
      ],
    }
  }),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

// ── Imperative helper — callable outside React components ────────────────────
const add = (type: ToastType, title: string, opts?: { description?: string; duration?: number }) =>
  useToastStore.getState().add({ type, title, duration: opts?.duration ?? 4000, ...opts })

export const toast = {
  success: (title: string, opts?: { description?: string }) => add('success', title, opts),
  error:   (title: string, opts?: { description?: string; duration?: number }) =>
             add('error', title, { duration: 5000, ...opts }),
  info:    (title: string, opts?: { description?: string }) => add('info', title, opts),
  warning: (title: string, opts?: { description?: string }) => add('warning', title, opts),
}
