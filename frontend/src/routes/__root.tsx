import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
