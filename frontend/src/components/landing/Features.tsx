import { LayoutGrid, ThumbsUp, Sparkles, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, stagger } from '@/lib/animations'

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
    title: "IA pour t'aider",
    description:
      "Améliore ta rédaction en un clic grâce à l'intelligence artificielle intégrée directement dans l'éditeur de posts.",
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
        <motion.div
          className="flex flex-col items-center text-center mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight mb-3">
            Tout ce qu'il faut pour apprendre ensemble
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl">
            DevHelp combine la simplicité d'un forum classique avec des outils modernes
            pour une expérience d'entraide efficace.
          </motion.p>
        </motion.div>

        {/* Grille */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-[border-color,box-shadow] duration-300 cursor-default"
            >
              <motion.div
                className="p-2.5 rounded-lg bg-primary/10 text-primary h-fit shrink-0"
                whileHover={{ scale: 1.1, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
