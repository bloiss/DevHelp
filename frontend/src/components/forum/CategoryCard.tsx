import { Link } from '@tanstack/react-router'
import { PenSquare } from 'lucide-react'
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

export function CategoryCard({ name, slug, description, icon: Icon, color, postCount, pillar }: CategoryCardProps) {
  const pillarLabel = {
    dev: 'Développement',
    community: 'Communauté',
    ai: 'IA',
  }[pillar]

  return (
    <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all duration-200 group flex flex-col">
      <Link to="/forum/$category" params={{ category: slug }} className="flex-1">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between">
            <div className={cn('p-2.5 rounded-lg', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="text-xs font-normal shrink-0">
              {pillarLabel}
            </Badge>
          </div>
          <div>
            <CardTitle className="text-base group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm leading-snug">
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

      <div className="px-6 pb-4">
        <Link to="/forum/new">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <PenSquare className="h-3.5 w-3.5" />
            Nouveau post
          </Button>
        </Link>
      </div>
    </Card>
  )
}
