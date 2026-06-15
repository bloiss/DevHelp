import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryService } from '@/services/category.service'
import { getCategoryBySlug } from '@/data/categories'
import type { Category } from '@/types/post'

interface CategorySelectProps {
  value: string
  onChange: (categoryId: string) => void
  error?: string
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.list,
    staleTime: 5 * 60 * 1000,
  })

  // Fermer si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = categories.find((c) => c.id === value)
  const selectedMeta = selected ? getCategoryBySlug(selected.slug) : null

  // Grouper par pilier
  const devCats = categories.filter((c) => {
    const meta = getCategoryBySlug(c.slug)
    return meta?.pillar === 'dev'
  })
  const communityCats = categories.filter((c) => {
    const meta = getCategoryBySlug(c.slug)
    return meta?.pillar === 'community'
  })
  // Catégories sans meta connue
  const otherCats = categories.filter((c) => !getCategoryBySlug(c.slug))

  function renderOption(cat: Category) {
    const meta = getCategoryBySlug(cat.slug)
    const Icon = meta?.icon
    const isSelected = cat.id === value
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => { onChange(cat.id); setOpen(false) }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-accent text-foreground',
        )}
      >
        {Icon && meta ? (
          <div className={cn('p-1.5 rounded-md shrink-0', meta.color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-md bg-muted shrink-0" />
        )}
        <span className="flex-1 font-medium">{cat.name}</span>
        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card text-sm transition-all',
          'focus:outline-none',
          open ? 'border-primary ring-2 ring-primary/20' : 'border-input hover:border-primary/50',
          error ? 'border-destructive' : '',
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        {selected && selectedMeta ? (
          <>
            <div className={cn('p-1.5 rounded-md shrink-0', selectedMeta.color)}>
              <selectedMeta.icon className="h-3.5 w-3.5" />
            </div>
            <span className="flex-1 text-left font-medium">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">
            {isLoading ? 'Chargement…' : 'Choisir une rubrique…'}
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto p-2 space-y-3">

            {devCats.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Développement
                </p>
                <div className="space-y-0.5">
                  {devCats.map(renderOption)}
                </div>
              </div>
            )}

            {communityCats.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Communauté
                </p>
                <div className="space-y-0.5">
                  {communityCats.map(renderOption)}
                </div>
              </div>
            )}

            {otherCats.length > 0 && (
              <div className="space-y-0.5">
                {otherCats.map(renderOption)}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
