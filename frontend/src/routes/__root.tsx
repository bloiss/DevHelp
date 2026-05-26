import { createRootRoute } from '@tanstack/react-router'
import { Navbar }         from '@/components/layout/Navbar'
import { BottomNav }      from '@/components/layout/BottomNav'
import { PageTransition } from '@/components/layout/PageTransition'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Toaster }        from '@/components/ui/Toaster'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">

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
