import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
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
    <Link to="/forum/$category" params={{ category: slug }}>
      <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
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
      </Card>
    </Link>
  )
}
