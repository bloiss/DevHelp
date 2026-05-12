import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Code2, Bell, MessageSquare, User, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300',
      scrolled && 'shadow-[0_1px_20px_hsl(var(--foreground)/0.06)]',
    )}>
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center">

        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg group">
            <Code2 className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
            <span>DevHelp</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/forum"
            className="relative px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-4/5"
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
          >
            Forum
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/forum/new"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                + Nouveau post
              </Link>

              <Link to="/notifications" className="p-2 rounded-md hover:bg-accent transition-colors relative group">
                <Bell className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </Link>

              <Link to="/messages" className="p-2 rounded-md hover:bg-accent transition-colors group">
                <MessageSquare className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </Link>

              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                className="p-2 rounded-md hover:bg-accent transition-colors group"
              >
                <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground group"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/auth/register"
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                S'inscrire
              </Link>
            </>
          )}

          <button className="md:hidden p-2 rounded-md hover:bg-accent transition-colors">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </header>
  )
}
