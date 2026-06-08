import { cn } from '@/lib/utils'
import { TAG_DEFINITIONS } from '@/data/postTags'

interface TagBadgeProps {
  tag: string
  className?: string
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const def = TAG_DEFINITIONS[tag.toLowerCase()]
  if (!def) return null

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none',
        def.className,
        className,
      )}
    >
      {def.label}
    </span>
  )
}

interface TagListProps {
  tags: string[]
  max?: number
  className?: string
}

export function TagList({ tags, max = 3, className }: TagListProps) {
  if (!tags.length) return null
  const visible = tags.slice(0, max)

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {visible.map((tag) => (
        <TagBadge key={tag} tag={tag} />
      ))}
      {tags.length > max && (
        <span className="text-[10px] text-muted-foreground">+{tags.length - max}</span>
      )}
    </div>
  )
}
