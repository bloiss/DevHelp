import { Link } from '@tanstack/react-router'
import { PenSquare, ArrowRight } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CategoryMeta } from '@/data/categories'

const PILLAR_LABEL: Record<string, string> = {
  dev: 'Développement',
  community: 'Communauté',
}

const SPRING = { type: 'spring', stiffness: 350, damping: 28 } as const

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
}

interface CategoryGridProps {
  categories: CategoryMeta[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {categories.map((cat) => {
        const Icon = cat.icon
        return (
          <motion.div
            key={cat.slug}
            variants={cardVariants}
            whileHover={{ y: -5 }}
            transition={SPRING}
            className="h-full"
          >
            <div
              className={cn(
                'group relative flex flex-col h-full rounded-2xl overflow-hidden',
                'border border-border bg-card/90 backdrop-blur-sm',
                'transition-all duration-300',
                'hover:border-primary/30',
                'hover:shadow-[0_12px_40px_hsl(var(--primary)/0.1),0_2px_12px_hsl(0_0%_0%/0.06)]',
                'dark:hover:shadow-[0_16px_48px_hsl(0_0%_0%/0.4),0_0_0_1px_hsl(var(--primary)/0.2)]',
              )}
            >
              <div className={cn('h-[3px] w-full shrink-0', cat.color)} />

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-5">
                  <motion.div
                    className={cn('p-3 rounded-xl', cat.color)}
                    whileHover={{ scale: 1.12, rotate: 7 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <Badge variant="secondary" className="text-xs font-normal shrink-0">
                    {PILLAR_LABEL[cat.pillar] ?? cat.pillar}
                  </Badge>
                </div>

                <Link to="/forum/$category" params={{ category: cat.slug }} className="block">
                  <h3 className="font-bold text-base mb-1.5 group-hover:text-primary transition-colors duration-200">
                    {cat.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="px-6 pb-5 pt-3 border-t border-border/50 flex gap-2">
                <Link to="/forum/$category" params={{ category: cat.slug }} className="flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    Voir les posts
                  </Button>
                </Link>
                <Link to="/forum/new" search={{ category: undefined }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 hover:border-primary/40 transition-colors"
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Nouveau</span>
                  </Button>
                </Link>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary)/0.04) 0%, transparent 60%)',
                }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
