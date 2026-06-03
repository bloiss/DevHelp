import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/data/categories'
import { fadeInUp, stagger } from '@/lib/animations'

export function CategoriesPreview() {
  const preview = CATEGORIES.slice(0, 6)

  return (
    <section className="py-20 px-4 bg-muted/40">
      <div className="max-w-5xl mx-auto">

        <motion.div
          className="flex flex-col items-center text-center mb-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight mb-3">
            Explore les rubriques
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground">
            Des espaces dédiés à chaque technologie pour des discussions ciblées et pertinentes.
          </motion.p>
        </motion.div>

        {/* Grille */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {preview.map(({ name, slug, icon: Icon, color, description }) => (
            <motion.div
              key={slug}
              variants={fadeInUp}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            >
              <Link
                to="/forum/$category"
                params={{ category: slug }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-[border-color,box-shadow] duration-300 group"
              >
                <div className={`p-2 rounded-lg shrink-0 ${color} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{description.split('.')[0]}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/forum">
              <Button variant="outline" className="gap-2 hover:border-primary/40 transition-colors duration-300">
                Voir toutes les rubriques
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
