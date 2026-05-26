import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { categoryService } from '@/services/category.service'

interface CategorySelectProps {
  value: string
  onChange: (categoryId: string) => void
  error?: string
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.list,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
      className={cn(
        'h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
        'focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50',
        'text-foreground disabled:opacity-50',
        error ? 'border-destructive' : 'border-input',
      )}
    >
      <option value="" disabled>
        {isLoading ? 'Chargement…' : 'Choisir une rubrique…'}
      </option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  )
}
