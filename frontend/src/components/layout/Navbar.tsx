import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Code2, Bell, MessageSquare, User, LogOut, Sun, Moon, Search, PenSquare, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useCommandStore } from '@/stores/commandStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationPanel } from '@/components/ui/NotificationPanel'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function NavIconLink({
  to,
  label,
  children,
  badge,
}: {
  to: string
  label: string
  children: React.ReactNode
  badge?: number
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active = pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'relative p-2 rounded-md transition-colors group',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
      aria-label={label}
    >
      {active && (
        <motion.span
          layoutId="nav-icon-active"
          className="absolute inset-0 rounded-md"
          style={{ background: 'var(--gold-soft)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative flex">
        {children}
        {badge != null && badge > 0 && (
          <motion.span
            key={badge}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold leading-none"
            style={{
              background: 'var(--gold)',
              color: 'var(--primary-foreground)',
              minWidth: 14,
              height: 14,
              padding: '0 3px',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </span>
    </Link>
  )
}

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()
  const { setTheme, resolvedTheme } = useThemeStore()
  const { open: openCommand } = useCommandStore()
  const { unreadCount, toggle: toggleNotif } = useNotificationStore()
  const [scrolled, setScrolled] = useState(false)
  const isDark = resolvedTheme() === 'dark'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl transition-all duration-300',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-px',
      'after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent',
      scrolled && 'shadow-[0_4px_24px_hsl(var(--foreground)/0.05)] dark:shadow-[0_4px_32px_hsl(0_0%_0%/0.4)]',
    )}>
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">

        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg group">
            <Code2 className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" style={{ color: 'var(--gold)' }} />
            <span>DevHelp</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/home"
            className="relative px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
          >
            Accueil
          </Link>
          <Link
            to="/forum"
            className="relative px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
          >
            Forum
          </Link>
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <Link
              to="/admin"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{ className: 'bg-accent text-accent-foreground' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        <button
          onClick={openCommand}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm hover:bg-accent hover:text-foreground transition-colors duration-200 group"
          aria-label="Ouvrir la recherche"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Rechercher…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background/80 text-muted-foreground leading-none ml-1 group-hover:border-border/80">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-1">

          <div className="hidden md:flex items-center gap-1">

            {isAuthenticated && (
              <Link
                to="/forum/new"
                search={{ category: undefined }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
              >
                <PenSquare className="h-3.5 w-3.5" />
                Nouveau post
              </Link>
            )}

            <NavIconLink to="/messages" label="Messages">
              <MessageSquare className="h-4 w-4" />
            </NavIconLink>

            <div className="relative">
              <button
                onClick={toggleNotif}
                className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold leading-none"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--primary-foreground)',
                      minWidth: 14,
                      height: 14,
                      padding: '0 3px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>
              <NotificationPanel />
            </div>

            <NavIconLink
              to={isAuthenticated && user ? `/profile/${user.username}` : '/profile'}
              label="Profil"
            >
              <User className="h-4 w-4" />
            </NavIconLink>

            {isAuthenticated && (
              <button
                onClick={logout}
                className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground group"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  to="/auth/login"
                  className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  Connexion
                </Link>
                <Link
                  to="/auth/register"
                  className="px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'var(--gold)', color: 'var(--primary-foreground)' }}
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          <button
            onClick={openCommand}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Rechercher"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors relative overflow-hidden text-muted-foreground hover:text-foreground"
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex"
                >
                  <Sun className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex"
                >
                  <Moon className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>
    </header>
  )
}
