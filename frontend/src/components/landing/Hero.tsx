import { Link } from '@tanstack/react-router'
import { ArrowRight, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 px-4">

      {/* Fond dégradé subtil */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">

        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted text-sm text-muted-foreground">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          <span>La communauté des développeurs</span>
        </div>

        {/* Titre principal */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Apprends, Partage et{' '}
          <span className="text-primary">Progresse</span>
        </h1>

        {/* Sous-titre */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          DevHelp est le forum pensé pour les développeurs. Pose tes questions,
          partage tes découvertes et aide la communauté à grandir.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link to="/forum">
            <Button size="lg" className="gap-2 text-base px-8">
              Explorer le forum
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth/register">
            <Button size="lg" variant="outline" className="text-base px-8">
              Créer un compte
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
