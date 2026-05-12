import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CallToAction() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Prêt à rejoindre la communauté ?
        </h2>

        <p className="text-muted-foreground text-lg">
          Des milliers de développeurs s'entraident chaque jour sur DevHelp.
          Ton prochain déblocage est peut-être à une question de distance.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/auth/register">
            <Button size="lg" className="gap-2 text-base px-8">
              Rejoindre gratuitement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/forum">
            <Button size="lg" variant="outline" className="text-base px-8">
              Parcourir sans compte
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
