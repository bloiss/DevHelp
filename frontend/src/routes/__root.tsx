import { createRootRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { PageTransition } from '@/components/layout/PageTransition'
import { CommandPalette } from '@/components/ui/CommandPalette'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">

      {/* ── Global ambient background ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.35]" />

        {/* Radial glow — top right */}
        <div
          className="absolute -top-[20%] -right-[15%] h-[700px] w-[700px] rounded-full blur-[120px]"
          style={{ background: 'var(--glow-a)' }}
        />
        {/* Radial glow — bottom left */}
        <div
          className="absolute -bottom-[15%] -left-[10%] h-[550px] w-[550px] rounded-full blur-[100px]"
          style={{ background: 'var(--glow-b)' }}
        />
        {/* Vignette — edges darken slightly for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.6)_100%)]" />
      </div>

      <Navbar />
      <main className="flex-1 flex flex-col">
        <PageTransition />
      </main>
      <CommandPalette />
    </div>
  )
}
