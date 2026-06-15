import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { PenSquare, Search, Layers, LayoutGrid } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryShowcase } from '@/components/forum/CategoryShowcase'
import { CategoryGrid } from '@/components/forum/CategoryGrid'
import { BackButton } from '@/components/shared/BackButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/data/categories'
import { fadeInUp, stagger } from '@/lib/animations'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/forum/')({
  component: ForumHub,
})

const PILLARS = [
  { key: 'all', label: 'Tout voir' },
  { key: 'dev', label: 'Développement' },
  { key: 'community', label: 'Communauté' },
] as const

type PillarKey = typeof PILLARS[number]['key']
type ViewMode = 'showcase' | 'grid'

function ForumHub() {
  const [activePillar, setActivePillar] = useState<PillarKey>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('devhelp-forum-view')
    return saved === 'grid' ? 'grid' : 'showcase'
  })

  function updateViewMode(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem('devhelp-forum-view', mode)
  }

  const filtered = CATEGORIES.filter((cat) => {
    const matchesPillar = activePillar === 'all' || cat.pillar === activePillar
    const matchesSearch =
      search === '' ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    return matchesPillar && matchesSearch
  })

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-10"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp} className="mb-2">
        <BackButton />
      </motion.div>

      <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Forum</h1>
          <p className="text-muted-foreground">
            {CATEGORIES.length} rubriques pour discuter, apprendre et progresser ensemble.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/forum/new" search={{ category: undefined }}>
            <Button className="shrink-0 gap-2">
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau post</span>
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PILLARS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActivePillar(key)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md font-medium transition-all',
                activePillar === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une rubrique…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg ml-auto shrink-0">
          <button
            onClick={() => updateViewMode('showcase')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all',
              viewMode === 'showcase'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Mode exposition"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exposition</span>
          </button>
          <button
            onClick={() => updateViewMode('grid')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all',
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Mode grille"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grille</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          viewMode === 'showcase' ? (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <CategoryShowcase categories={filtered} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <CategoryGrid categories={filtered} />
            </motion.div>
          )
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-muted-foreground text-center py-16"
          >
            Aucune rubrique ne correspond à "{search}".
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
