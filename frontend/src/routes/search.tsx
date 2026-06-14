import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Search, SearchX, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/forum/PostCard'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { MOCK_POSTS } from '@/data/mockPosts'
import { CATEGORIES } from '@/data/categories'
import { cn } from '@/lib/utils'
import { fadeInUp, stagger, staggerFast } from '@/lib/animations'
import { api } from '@/lib/api'
import type { User } from '@/types/user'


export const Route = createFileRoute('/search')({
  component: SearchPage,
})

type Tab = 'posts' | 'users' | 'categories'

const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'users', label: 'Utilisateurs' },
  { key: 'categories', label: 'Catégories' },
]

const ROLE_LABEL: Record<string, string | null> = {
  moderator: 'Modérateur',
  admin: 'Admin',
  user: null,
}

function getMockUsers(): User[] {
  const seen = new Set<string>()
  return MOCK_POSTS.reduce<User[]>((acc, post) => {
    if (!seen.has(post.author.id)) {
      seen.add(post.author.id)
      acc.push(post.author)
    }
    return acc
  }, [])
}

function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [postResults, setPostResults] = useState<any[]>([])
  useEffect(() => {
  if (!query.trim()) {
    setPostResults([])
    return
  }
  api.get('/posts', { params: { q: query } }).then((res) => {
    setPostResults(res.data.posts ?? [])
  })
}, [query])

  const q = query.toLowerCase().trim()

  const userResults = q
    ? getMockUsers().filter((u) => u.username.toLowerCase().includes(q))
    : []

  const categoryResults = q
    ? CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    : []

  const counts: Record<Tab, number> = {
    posts: postResults.length,
    users: userResults.length,
    categories: categoryResults.length,
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >

      {/* Barre de recherche */}
      <motion.div variants={fadeInUp} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Recherche sémantique — retrouve des posts, des membres ou des rubriques.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="React, useEffect, alex_dev…"
            className="pl-10 h-11 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {/* État initial */}
      {!q && (
        <motion.div variants={fadeInUp}>
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title="Lance une recherche"
            description="Tape un mot-clé pour trouver des posts, des membres ou des rubriques."
          />
        </motion.div>
      )}

      {/* Résultats */}
      {q && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Onglets */}
          <motion.div variants={fadeInUp} className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all',
                  activeTab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                    activeTab === key
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted-foreground/20 text-muted-foreground',
                  )}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Posts */}
          {activeTab === 'posts' && (
            postResults.length > 0 ? (
              <motion.div className="flex flex-col gap-3" variants={staggerFast} initial="hidden" animate="visible">
                {postResults.map((post) => (
                  <motion.div key={post.id} variants={fadeInUp}>
                    <PostCard post={post} categorySlug={post.category.slug} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={<SearchX className="h-10 w-10" />}
                title={`Aucun post pour "${query}"`}
                description="Essaie avec d'autres mots-clés."
              />
            )
          )}

          {/* Utilisateurs */}
          {activeTab === 'users' && (
            userResults.length > 0 ? (
              <motion.div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden" variants={staggerFast} initial="hidden" animate="visible">
                {userResults.map((user) => (
                  <motion.div key={user.id} variants={fadeInUp}>
                  <Link
                    to="/profile/$username"
                    params={{ username: user.username }}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-accent/50 transition-colors"
                  >
                    <Avatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">@{user.username}</span>
                        {ROLE_LABEL[user.role] && (
                          <Badge variant="secondary" className="text-xs">
                            {ROLE_LABEL[user.role]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {MOCK_POSTS.filter((p) => p.author.id === user.id).length} post(s)
                      </p>
                    </div>
                  </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={<SearchX className="h-10 w-10" />}
                title={`Aucun utilisateur pour "${query}"`}
                description="Vérifie l'orthographe du nom d'utilisateur."
              />
            )
          )}

          {/* Catégories */}
          {activeTab === 'categories' && (
            categoryResults.length > 0 ? (
              <motion.div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden" variants={staggerFast} initial="hidden" animate="visible">
                {categoryResults.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <motion.div key={cat.slug} variants={fadeInUp}>
                    <Link
                      to="/forum/$category"
                      params={{ category: cat.slug }}
                      className="flex items-center gap-4 px-4 py-4 hover:bg-accent/50 transition-colors group"
                    >
                      <div className={cn('p-2.5 rounded-lg shrink-0', cat.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <EmptyState
                icon={<SearchX className="h-10 w-10" />}
                title={`Aucune rubrique pour "${query}"`}
                description="Parcours toutes les rubriques depuis le forum."
              />
            )
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
