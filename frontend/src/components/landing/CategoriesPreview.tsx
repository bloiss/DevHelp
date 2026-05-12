import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/data/categories'

export function CategoriesPreview() {
  const preview = CATEGORIES.slice(0, 6)

  return (
    <section className="py-20 px-4 bg-muted/40">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Explore les rubriques
          </h2>
          <p className="text-muted-foreground">
            Des espaces dédiés à chaque technologie pour des discussions ciblées et pertinentes.
          </p>
        </div>

        {/* Grille de rubriques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {preview.map(({ name, slug, icon: Icon, color, description }) => (
            <Link
              key={slug}
              to="/forum/$category"
              params={{ category: slug }}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{description.split('.')[0]}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/forum">
            <Button variant="outline" className="gap-2">
              Voir toutes les rubriques
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
