import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Code2, FileCode2, Atom, Server, Braces, Database,
  ShieldAlert, Users, BookOpen, GraduationCap, Search,
} from 'lucide-react'
import { CategoryCard } from '@/components/forum/CategoryCard'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/forum/')({
  component: ForumHub,
})

// Données statiques — remplacées par un appel API en semaine 2
const CATEGORIES = [
  // ── Développement ──────────────────────────────────
  {
    name: 'HTML / CSS',
    slug: 'html-css',
    description: 'Mise en page, flexbox, grid, animations et bonnes pratiques du web.',
    icon: FileCode2,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    description: 'Vanilla JS, ES2024+, async/await, manipulation du DOM et écosystème npm.',
    icon: Braces,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'React',
    slug: 'react',
    description: 'Composants, hooks, state management, TanStack, Zustand et patterns modernes.',
    icon: Atom,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'Golang',
    slug: 'golang',
    description: 'Goroutines, APIs REST, gestion des erreurs, interfaces et patterns Go.',
    icon: Server,
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'PHP',
    slug: 'php',
    description: 'PHP moderne, Laravel, Symfony, Composer et architecture back-end.',
    icon: Code2,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'Bases de données',
    slug: 'databases',
    description: 'SQL, PostgreSQL, MySQL, MongoDB, ORM et optimisation des requêtes.',
    icon: Database,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  {
    name: 'Cybersécurité',
    slug: 'security',
    description: 'OWASP, authentification, JWT, chiffrement, pentesting et bonnes pratiques.',
    icon: ShieldAlert,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    postCount: 0,
    pillar: 'dev' as const,
  },
  // ── Communauté ────────────────────────────────────
  {
    name: 'Entraide générale',
    slug: 'general',
    description: 'Bloqué sur un bug ? Pose ta question ici, la communauté répond.',
    icon: Users,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    postCount: 0,
    pillar: 'community' as const,
  },
  {
    name: 'Ressources',
    slug: 'resources',
    description: 'Liens utiles, tutoriels, outils, librairies et veille technologique.',
    icon: BookOpen,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    postCount: 0,
    pillar: 'community' as const,
  },
  {
    name: 'Projets étudiants',
    slug: 'projects',
    description: 'Présentez vos projets, demandez des retours et trouvez des collaborateurs.',
    icon: GraduationCap,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    postCount: 0,
    pillar: 'community' as const,
  },
]

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

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Forum</h1>
        <p className="text-muted-foreground">
          {CATEGORIES.length} rubriques pour discuter, apprendre et progresser ensemble.
        </p>
      </div>

      {/* Barre de filtres + recherche */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Onglets piliers */}
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

        {/* Recherche */}
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

      {/* Grille des catégories */}
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
