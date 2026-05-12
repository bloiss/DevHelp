import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { PenSquare, Search } from 'lucide-react'
import { CategoryCard } from '@/components/forum/CategoryCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/data/categories'

export const Route = createFileRoute('/forum/')({
  component: ForumHub,
})

const PILLARS = [
  { key: 'all', label: 'Tout voir' },
  { key: 'dev', label: 'Développement' },
  { key: 'community', label: 'Communauté' },
] as const

type PillarKey = typeof PILLARS[number]['key']

function ForumHub() {
  const [activePillar, setActivePillar] = useState<PillarKey>('all')
  const [search, setSearch] = useState('')

  const filtered = CATEGORIES.filter((cat) => {
    const matchesPillar = activePillar === 'all' || cat.pillar === activePillar
    const matchesSearch =
      search === '' ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    return matchesPillar && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Forum</h1>
          <p className="text-muted-foreground">
            {CATEGORIES.length} rubriques pour discuter, apprendre et progresser ensemble.
          </p>
        </div>
        <Link to="/forum/new">
          <Button className="shrink-0 gap-2">
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau post</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {PILLARS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActivePillar(key)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
                activePillar === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une rubrique…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-16">
          Aucune rubrique ne correspond à "{search}".
        </p>
      )}
    </div>
  )
}
