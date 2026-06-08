import { useEffect } from 'react'
import { createRootRoute } from '@tanstack/react-router'
import { Navbar }         from '@/components/layout/Navbar'
import { BottomNav }      from '@/components/layout/BottomNav'
import { PageTransition } from '@/components/layout/PageTransition'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Toaster }        from '@/components/ui/Toaster'
import { useAuthStore }          from '@/stores/authStore'
import { useNotificationStore }  from '@/stores/notificationStore'
import { useWebSocket }          from '@/hooks/useWebSocket'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { isAuthenticated } = useAuthStore()
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore()

  // Connexion WebSocket temps réel (notifications + messages)
  useWebSocket()

  // Charger les notifications au montage (si connecté) et quand l'état d'auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated, fetchNotifications])

  // Polling de secours : rafraîchit le compteur toutes les 30s
  useEffect(() => {
    if (!isAuthenticated) return
    const id = setInterval(() => fetchUnreadCount(), 30_000)
    return () => clearInterval(id)
  }, [isAuthenticated, fetchUnreadCount])

  return (
    <div className="min-h-screen bg-background flex flex-col relative">

      {/* ── Global ambient background ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.35]" />
        <div
          className="absolute -top-[20%] -right-[15%] h-[700px] w-[700px] rounded-full blur-[120px]"
          style={{ background: 'var(--glow-a)' }}
        />
        <div
          className="absolute -bottom-[15%] -left-[10%] h-[550px] w-[550px] rounded-full blur-[100px]"
          style={{ background: 'var(--glow-b)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.6)_100%)]" />
      </div>

      <Navbar />
      {/* pb-14 on mobile to clear the BottomNav */}
      <main className="flex-1 flex flex-col pb-14 md:pb-0">
        <PageTransition />
      </main>
      <BottomNav />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
