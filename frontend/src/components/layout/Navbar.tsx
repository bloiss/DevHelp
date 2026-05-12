import { Link } from '@tanstack/react-router'
import { Code2, Bell, MessageSquare, User, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center">

        {/* Logo — flex-1 pour occuper la moitié gauche */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            <span>DevHelp</span>
          </Link>
        </div>

        {/* Navigation centrale — toujours au milieu exact */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/forum"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
          >
            Forum
          </Link>
        </div>

        {/* Actions droite — flex-1 pour occuper la moitié droite */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/forum/new"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                + Nouveau post
              </Link>

              <Link to="/notifications" className="p-2 rounded-md hover:bg-accent transition-colors relative">
                <Bell className="h-4 w-4" />
              </Link>

              <Link to="/messages" className="p-2 rounded-md hover:bg-accent transition-colors">
                <MessageSquare className="h-4 w-4" />
              </Link>

              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4" />
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
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
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                S'inscrire
              </Link>
            </>
          )}

          {/* Menu mobile */}
          <button className="md:hidden p-2 rounded-md hover:bg-accent transition-colors">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </header>
  )
}
