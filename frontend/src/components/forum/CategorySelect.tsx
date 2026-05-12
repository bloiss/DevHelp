import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/data/categories'

interface CategorySelectProps {
  value: string
  onChange: (slug: string) => void
  error?: string
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
        'focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50',
        'text-foreground',
        error ? 'border-destructive' : 'border-input',
      )}
    >
      <option value="" disabled>Choisir une rubrique…</option>
      {CATEGORIES.map(({ slug, name }) => (
        <option key={slug} value={slug}>{name}</option>
      ))}
    </select>
  )
}
