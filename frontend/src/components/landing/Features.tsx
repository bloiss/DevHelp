import { LayoutGrid, ThumbsUp, Sparkles, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'Organisé par technologie',
    description:
      'Dix rubriques dédiées — HTML/CSS, JavaScript, React, Golang, PHP et plus. Trouve rapidement les discussions qui te concernent.',
  },
  {
    icon: ThumbsUp,
    title: 'Votes communautaires',
    description:
      'Les meilleures réponses remontent naturellement. La communauté décide de ce qui est utile, pas un algorithme opaque.',
  },
  {
    icon: Sparkles,
    title: 'IA pour t\'aider',
    description:
      'Améliore ta rédaction en un clic grâce à l\'intelligence artificielle intégrée directement dans l\'éditeur de posts.',
  },
  {
    icon: ShieldCheck,
    title: 'Modération intelligente',
    description:
      'Un système de modération automatique par IA analyse le contenu en temps réel pour maintenir un espace sain et bienveillant.',
  },
]

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Tout ce qu'il faut pour apprendre ensemble
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            DevHelp combine la simplicité d'un forum classique avec des outils modernes
            pour une expérience d'entraide efficace.
          </p>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary h-fit shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
