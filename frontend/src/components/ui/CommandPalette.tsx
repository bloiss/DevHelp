import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Hash, PenSquare, Bell, MessageSquare,
  Settings, User, ArrowRight, CornerDownLeft,
  SlidersHorizontal,
} from 'lucide-react'
import { useCommandStore } from '@/stores/commandStore'
import { useAuthStore }    from '@/stores/authStore'
import { CATEGORIES }      from '@/data/categories'

import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommandItem {
  id:        string
  label:     string
  sublabel?: string
  icon:      React.ReactNode
  action:    () => void
  shortcut?: string
}

interface CommandGroup {
  id:    string
  label: string
  items: CommandItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function IconWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'flex items-center justify-center h-7 w-7 rounded-lg shrink-0 border border-border bg-muted/60 text-muted-foreground',
      className,
    )}>
      {children}
    </span>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground leading-none">
      {children}
    </kbd>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef   = useRef<HTMLInputElement>(null)
  const listRef    = useRef<HTMLDivElement>(null)
  const q = query.toLowerCase().trim()

  // Global Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  // Reset selection when query changes
  useEffect(() => { setSelected(0) }, [q])

  // ── Navigation helper ──────────────────────────────────────────────────
  function go(to: string, params?: Record<string, string>) {
    close()
    // Small delay so the close animation plays before navigation
    setTimeout(() => navigate({ to, params } as Parameters<typeof navigate>[0]), 80)
  }

  // ── Build groups ──────────────────────────────────────────────────────
  const groups = useMemo<CommandGroup[]>(() => {
    const navItems: CommandItem[] = [
      {
        id: 'nav-forum',
        label: 'Forum',
        sublabel: 'Explorer les rubriques',
        icon: <IconWrap><Hash className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/forum'),
        shortcut: 'F',
      },
      {
        id: 'nav-new',
        label: 'Nouveau post',
        sublabel: 'Poser une question',
        icon: <IconWrap><PenSquare className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/forum/new'),
      },
      {
        id: 'nav-search',
        label: 'Recherche',
        sublabel: 'Rechercher posts, membres…',
        icon: <IconWrap><Search className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/search'),
      },
      {
        id: 'nav-notifs',
        label: 'Notifications',
        icon: <IconWrap><Bell className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/notifications'),
      },
      {
        id: 'nav-messages',
        label: 'Messages',
        icon: <IconWrap><MessageSquare className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/messages'),
      },
      {
        id: 'nav-settings',
        label: 'Paramètres',
        icon: <IconWrap><Settings className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/settings'),
      },
      ...(isAuthenticated && user ? [{
        id: 'nav-profile',
        label: 'Mon profil',
        sublabel: `@${user.username}`,
        icon: <IconWrap><User className="h-3.5 w-3.5" /></IconWrap>,
        action: () => go('/profile/$username', { username: user.username }),
      }] : []),
    ]

    const catItems: CommandItem[] = CATEGORIES
      .filter(c =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
      )
      .map(c => {
        const Icon = c.icon
        return {
          id: `cat-${c.slug}`,
          label: c.name,
          sublabel: c.description,
          icon: (
            <span className={cn('flex items-center justify-center h-7 w-7 rounded-lg shrink-0', c.color)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
          ),
          action: () => go('/forum/$category', { category: c.slug }),
        }
      })

    if (!q) {
      return [
        { id: 'nav',  label: 'Naviguer',              items: navItems  },
        { id: 'cats', label: 'Rubriques populaires',  items: CATEGORIES.slice(0, 4).map(c => {
          const Icon = c.icon
          return {
            id: `cat-${c.slug}`,
            label: c.name,
            sublabel: c.description,
            icon: (
              <span className={cn('flex items-center justify-center h-7 w-7 rounded-lg shrink-0', c.color)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            ),
            action: () => go('/forum/$category', { category: c.slug }),
          }
        })},
      ]
    }

    const filtered = navItems.filter(n =>
      n.label.toLowerCase().includes(q) ||
      (n.sublabel ?? '').toLowerCase().includes(q),
    )

    return [
      ...(filtered.length ? [{ id: 'nav',  label: 'Pages',    items: filtered }] : []),
      ...(catItems.length  ? [{ id: 'cats', label: 'Rubriques', items: catItems }] : []),
    ]
  }, [q, isAuthenticated, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups])
  const total     = flatItems.length

  // Keyboard navigation inside the palette
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, total - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        flatItems[selected]?.action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, selected, total, flatItems, close])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  // Flat index counter used during render
  let globalIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          {/* ── Panel ─────────────────────────────────────────────────── */}
          <motion.div
            key="panel"
            className="fixed inset-x-0 top-[12vh] z-50 flex justify-center px-4 pointer-events-none"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{ opacity: 0, y: -10,    scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="w-full max-w-xl pointer-events-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_24px_80px_hsl(0_0%_0%/0.18)] dark:shadow-[0_24px_80px_hsl(0_0%_0%/0.55)] overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une page, rubrique, post…"
                  className="flex-1 h-14 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
                    aria-label="Effacer"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ) : (
                  <Kbd>Esc</Kbd>
                )}
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[380px] overflow-y-auto overscroll-contain py-2">
                {total === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
                    <SlidersHorizontal className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Aucun résultat pour <span className="font-medium text-foreground">"{query}"</span>
                    </p>
                  </div>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="mb-1">
                      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                        {group.label}
                      </p>
                      {group.items.map(item => {
                        const idx = globalIndex++
                        const isSelected = idx === selected
                        return (
                          <button
                            key={item.id}
                            data-cmd-index={idx}
                            onClick={item.action}
                            onMouseEnter={() => setSelected(idx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 mx-1 py-2.5 rounded-lg text-left transition-colors duration-100',
                              'focus-visible:outline-none',
                              isSelected ? 'bg-accent ring-1 ring-inset ring-gold/30' : 'hover:bg-accent/60',
                            )}
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            {item.icon}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug truncate">
                                {item.label}
                              </p>
                              {item.sublabel && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {item.sublabel}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gold)' }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Kbd>↑</Kbd><Kbd>↓</Kbd>
                  Naviguer
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CornerDownLeft className="h-3 w-3" />
                  Ouvrir
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                  <Kbd>Esc</Kbd>
                  Fermer
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
