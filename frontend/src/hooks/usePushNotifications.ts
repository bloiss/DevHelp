import { useState, useEffect, useCallback } from 'react'
import { notificationService } from '@/services/notification.service'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    try {
      const vapidKey = await notificationService.getVapidKey()
      if (!vapidKey) {
        setIsLoading(false)
        return false
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      const p256dh = json.keys?.p256dh ?? ''
      const auth   = json.keys?.auth   ?? ''

      await notificationService.savePushSub(sub.endpoint, p256dh, auth)

      setPermission('granted')
      setIsSubscribed(true)
      return true
    } catch {
      setPermission(Notification.permission as PushPermission)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) { setIsLoading(false); return true }

      await notificationService.deletePushSub(sub.endpoint)
      await sub.unsubscribe()

      setIsSubscribed(false)
      return true
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
