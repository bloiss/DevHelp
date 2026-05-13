import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Hash, MessageSquare, Bell, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/home',          Icon: Home,         label: 'Accueil'       },
  { to: '/forum',         Icon: Hash,         label: 'Forum'         },
  { to: '/messages',      Icon: MessageSquare,label: 'Messages'      },
  { to: '/notifications', Icon: Bell,         label: 'Notifs'        },
  { to: '/profile',       Icon: User,         label: 'Profil'        },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  function isActive(to: string) {
    if (to === '/home') return pathname === '/home' || pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ to, Icon, label }) => {
          const active = isActive(to)
          const isBell = to === '/notifications'

          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
              aria-label={label}
            >
              {/* Active dot */}
              {active && (
                <motion.span
                  layoutId="bottom-nav-dot"
                  className="absolute top-1.5 h-[2px] w-8 rounded-full"
                  style={{ background: 'var(--gold)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon + badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-150',
                    active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  style={active ? { color: 'var(--gold)' } : undefined}
                />
                {isBell && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full text-[8px] font-bold leading-none"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--primary-foreground)',
                      minWidth: 14,
                      height: 14,
                      padding: '0 3px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[9px] font-medium tracking-wide transition-colors duration-150',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
                style={active ? { color: 'var(--gold)' } : undefined}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
