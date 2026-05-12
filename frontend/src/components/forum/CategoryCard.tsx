import { Link } from '@tanstack/react-router'
import { PenSquare } from 'lucide-react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface CategoryCardProps {
  name: string
  slug: string
  description: string
  icon: LucideIcon
  color: string
  postCount?: number
  pillar: 'dev' | 'community' | 'ai'
}

const PILLAR_LABEL = {
  dev: 'Développement',
  community: 'Communauté',
  ai: 'IA',
}

export function CategoryCard({ name, slug, description, icon: Icon, color, postCount, pillar }: CategoryCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5])

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    animate(x, (e.clientX - rect.left) / rect.width - 0.5, { duration: 0.15, ease: 'linear' })
    animate(y, (e.clientY - rect.top) / rect.height - 0.5, { duration: 0.15, ease: 'linear' })
  }

  function onMouseLeave() {
    animate(x, 0, { duration: 0.5, ease: 'easeOut' })
    animate(y, 0, { duration: 0.5, ease: 'easeOut' })
  }

  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileHover={{ scale: 1.02, boxShadow: '0 12px 36px hsl(var(--primary) / 0.1), 0 0 0 1px hsl(var(--primary) / 0.12)' }}
        transition={{ scale: { type: 'spring', stiffness: 350, damping: 22 }, boxShadow: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="h-full border-border transition-colors duration-200 hover:border-primary/20 group flex flex-col">
          <Link to="/forum/$category" params={{ category: slug }} className="flex-1">
            <CardHeader className="gap-4 p-6">
              <div className="flex items-start justify-between">
                <motion.div
                  className={cn('p-3 rounded-xl', color)}
                  whileHover={{ scale: 1.12, rotate: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <Badge variant="secondary" className="text-xs font-normal shrink-0">
                  {PILLAR_LABEL[pillar]}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {name}
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </div>
              {postCount !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {postCount} post{postCount > 1 ? 's' : ''}
                </p>
              )}
            </CardHeader>
          </Link>

          <div className="px-6 pb-5">
            <Link to="/forum/new">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 hover:border-primary/40 transition-colors duration-200"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Nouveau post
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
