import {
  Code2, FileCode2, Atom, Server, Braces, Database,
  ShieldAlert, Users, BookOpen, GraduationCap,
  FileType2, Workflow, Terminal, Brain, Smartphone, Briefcase,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Pillar = 'dev' | 'community'

export interface CategoryMeta {
  name: string
  slug: string
  description: string
  icon: LucideIcon
  color: string
  pillar: Pillar
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: 'HTML / CSS',
    slug: 'html-css',
    description: 'Mise en page, flexbox, grid, animations et bonnes pratiques du web.',
    icon: FileCode2,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    pillar: 'dev',
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    description: 'Vanilla JS, ES2024+, async/await, manipulation du DOM et écosystème npm.',
    icon: Braces,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    pillar: 'dev',
  },
  {
    name: 'React',
    slug: 'react',
    description: 'Composants, hooks, state management, TanStack, Zustand et patterns modernes.',
    icon: Atom,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    pillar: 'dev',
  },
  {
    name: 'Golang',
    slug: 'golang',
    description: 'Goroutines, APIs REST, gestion des erreurs, interfaces et patterns Go.',
    icon: Server,
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    pillar: 'dev',
  },
  {
    name: 'PHP',
    slug: 'php',
    description: 'PHP moderne, Laravel, Symfony, Composer et architecture back-end.',
    icon: Code2,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    pillar: 'dev',
  },
  {
    name: 'Bases de données',
    slug: 'databases',
    description: 'SQL, PostgreSQL, MySQL, MongoDB, ORM et optimisation des requêtes.',
    icon: Database,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    pillar: 'dev',
  },
  {
    name: 'Cybersécurité',
    slug: 'security',
    description: 'OWASP, authentification, JWT, chiffrement, pentesting et bonnes pratiques.',
    icon: ShieldAlert,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    pillar: 'dev',
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    description: 'Typage statique, generics, utility types, config tsconfig et intégration avec React.',
    icon: FileType2,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    pillar: 'dev',
  },
  {
    name: 'Python',
    slug: 'python',
    description: 'Scripts, data science, Django/FastAPI, asyncio, packaging et bonnes pratiques.',
    icon: Terminal,
    color: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
    pillar: 'dev',
  },
  {
    name: 'DevOps / CI-CD',
    slug: 'devops',
    description: 'Docker, GitHub Actions, Kubernetes, déploiement continu et infrastructure as code.',
    icon: Workflow,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    pillar: 'dev',
  },
  {
    name: 'IA & LLM',
    slug: 'ai-llm',
    description: 'Intégration LLM, prompt engineering, RAG, fine-tuning et outils IA pour développeurs.',
    icon: Brain,
    color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    pillar: 'dev',
  },
  {
    name: 'Mobile',
    slug: 'mobile',
    description: 'React Native, Expo, Flutter, Swift, Kotlin et publication sur les stores.',
    icon: Smartphone,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    pillar: 'dev',
  },
  {
    name: 'Entraide générale',
    slug: 'general',
    description: 'Bloqué sur un bug ? Pose ta question ici, la communauté répond.',
    icon: Users,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pillar: 'community',
  },
  {
    name: 'Ressources',
    slug: 'resources',
    description: 'Liens utiles, tutoriels, outils, librairies et veille technologique.',
    icon: BookOpen,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    pillar: 'community',
  },
  {
    name: 'Projets étudiants',
    slug: 'projects',
    description: 'Présentez vos projets, demandez des retours et trouvez des collaborateurs.',
    icon: GraduationCap,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    pillar: 'community',
  },
  {
    name: 'Carrière & Emploi',
    slug: 'career',
    description: 'CV, entretiens techniques, alternance, freelance et évolution de carrière en tech.',
    icon: Briefcase,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    pillar: 'community',
  },
]

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
