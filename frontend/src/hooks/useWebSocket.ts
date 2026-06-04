import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

type WsEvent = { type: string; payload: unknown }

export function useWebSocket(handlers: Record<string, (payload: unknown) => void>) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setStatus('disconnected')
      return
    }

    setStatus('connecting')
    const base = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'
    const ws = new WebSocket(`${base}?token=${encodeURIComponent(accessToken)}`)

    ws.onopen  = () => setStatus('connected')
    ws.onclose = () => setStatus('disconnected')
    ws.onerror = () => setStatus('disconnected')
    ws.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data)
        handlersRef.current[event.type]?.(event.payload)
      } catch {}
    }

    return () => ws.close()
  }, [isAuthenticated, accessToken])

  return { status }
}
