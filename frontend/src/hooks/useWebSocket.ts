import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10

type WSEvent =
  | { type: 'notification'; payload: unknown }
  | { type: 'message'; payload: { conversation_id: string } }
  | { type: 'ping' }

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore()
  const queryClient = useQueryClient()

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      closeConnection()
      return
    }

    connect()

    return () => {
      closeConnection()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken])

  function connect() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${WS_BASE}/ws?token=${accessToken}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data)
        handleEvent(data)
      } catch {
        // message non-JSON ignoré
      }
    }

    ws.onclose = (event) => {
      if (!isMounted.current) return
      // Ne pas reconnecter si fermeture volontaire (logout)
      if (event.code === 1000) return
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  function handleEvent(event: WSEvent) {
    if (event.type === 'notification') {
      fetchNotifications()
      fetchUnreadCount()
    }

    if (event.type === 'message') {
      const { conversation_id } = event.payload
      // Invalide la liste des conversations + les messages de cette conversation
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', conversation_id] })
    }
  }

  function scheduleReconnect() {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
    reconnectAttempts.current += 1

    const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts.current, 30_000)

    reconnectTimeout.current = setTimeout(() => {
      if (isMounted.current && useAuthStore.getState().isAuthenticated) {
        connect()
      }
    }, delay)
  }

  function closeConnection() {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    if (wsRef.current) {
      wsRef.current.onclose = null // évite le reconnect automatique
      wsRef.current.close(1000, 'logout')
      wsRef.current = null
    }
    reconnectAttempts.current = 0
  }
}
