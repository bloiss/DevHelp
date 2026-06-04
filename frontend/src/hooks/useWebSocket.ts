import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

type WSEvent =
  | { type: 'notification'; payload: unknown }
  | { type: 'message'; payload: { conversation_id: string } }
  | { type: string; payload: unknown }

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WsStatus>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

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
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
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
      setStatus('disconnected')
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
    if (event.type === 'notification') {
      fetchNotifications()
      fetchUnreadCount()
    }
    if (event.type === 'message') {
      const { conversation_id } = event.payload as { conversation_id: string }
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', conversation_id] })
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
  }

  return { status }
}
