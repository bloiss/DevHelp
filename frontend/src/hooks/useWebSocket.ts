import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useMessagingStore } from '@/stores/messagingStore'
import type { ApiMessage } from '@/services/message.service'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'
const RECONNECT_DELAY_MS  = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

type WSEvent =
  | { type: 'notification';            payload: unknown }
  | { type: 'new_message';             payload: { conv_id: string; message: ApiMessage } }
  | { type: 'new_conversation_request'; payload: unknown }
  | { type: 'typing';                  payload: { conv_id: string; user_id: string; username: string; is_typing: boolean } }
  | { type: 'read_receipt';            payload: { conv_id: string; reader_id: string; message_ids: string[]; read_at: string } }
  | { type: 'presence';                payload: { user_id: string; is_online: boolean; conv_id?: string; last_seen?: string } }
  | { type: string;                    payload: unknown }

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore()
  const { setTyping, setPresence, setLatestReceipt, setWsSend } = useMessagingStore()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WsStatus>('disconnected')

  const wsRef              = useRef<WebSocket | null>(null)
  const reconnectAttempts  = useRef(0)
  const reconnectTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted          = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      closeConnection()
      return
    }
    connect()
    return () => { closeConnection() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken])

  function connect() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setStatus('connecting')
    const url = `${WS_BASE}/ws?token=${encodeURIComponent(accessToken!)}`
    const ws  = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      reconnectAttempts.current = 0
      // Exposer la fonction d'envoi dans le store global
      setWsSend((event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event))
        }
      })
    }

    ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data)
        handleEvent(data)
      } catch { /* ignore */ }
    }

    ws.onclose = (event) => {
      setStatus('disconnected')
      setWsSend(() => {})
      if (!isMounted.current) return
      if (event.code === 1000) return
      scheduleReconnect()
    }

    ws.onerror = () => {
      setStatus('disconnected')
      ws.close()
    }
  }

  function handleEvent(event: WSEvent) {
    switch (event.type) {

      // ─── Notifications ──────────────────────────────────────────
      case 'notification':
        fetchNotifications()
        fetchUnreadCount()
        break

      // ─── Nouveau message ────────────────────────────────────────
      case 'new_message': {
        const p = event.payload as { conv_id: string; message: ApiMessage }
        queryClient.setQueryData(['messages', p.conv_id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page: any, i: number) => {
              if (i !== 0) return page
              return { ...page, data: [...page.data, p.message] }
            }),
          }
        })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        break
      }

      // ─── Demande de conversation ────────────────────────────────
      case 'new_conversation_request':
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        fetchNotifications()
        fetchUnreadCount()
        break

      // ─── Indicateur de frappe ───────────────────────────────────
      case 'typing': {
        const p = event.payload as { conv_id: string; user_id: string; username: string; is_typing: boolean }
        setTyping({ convId: p.conv_id, userId: p.user_id, username: p.username, isTyping: p.is_typing, at: Date.now() })
        break
      }

      // ─── Accusé de lecture ──────────────────────────────────────
      case 'read_receipt': {
        const p = event.payload as { conv_id: string; reader_id: string; message_ids: string[]; read_at: string }
        setLatestReceipt({ convId: p.conv_id, readerId: p.reader_id, messageIds: p.message_ids, readAt: p.read_at })
        queryClient.setQueryData(['messages', p.conv_id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: any) => {
                if (p.message_ids.includes(msg.id)) {
                  return {
                    ...msg,
                    status: 'read',
                    reads: [
                      ...(msg.reads ?? []).filter((r: any) => r.user_id !== p.reader_id),
                      { user_id: p.reader_id, read_at: p.read_at, message_id: msg.id },
                    ],
                  }
                }
                return msg
              }),
            })),
          }
        })
        break
      }

      // ─── Présence ───────────────────────────────────────────────
      case 'presence': {
        const p = event.payload as { user_id: string; is_online: boolean; last_seen?: string }
        setPresence({ userId: p.user_id, isOnline: p.is_online, lastSeen: p.last_seen })
        break
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
    reconnectAttempts.current += 1
    const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30_000)
    reconnectTimeout.current = setTimeout(() => {
      if (isMounted.current && useAuthStore.getState().isAuthenticated) connect()
    }, delay)
  }

  function closeConnection() {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close(1000, 'logout')
      wsRef.current = null
    }
    reconnectAttempts.current = 0
    setStatus('disconnected')
    setWsSend(() => {})
  }

  return { status }
}
