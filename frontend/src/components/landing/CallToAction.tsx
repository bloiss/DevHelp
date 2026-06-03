import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { fadeInUp, stagger } from '@/lib/animations'

export function CallToAction() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">

      {/* Orbe de fond centré */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <motion.div
          className="h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
          Prêt à rejoindre la communauté ?
        </motion.h2>

        <motion.p variants={fadeInUp} className="text-muted-foreground text-lg">
          Des milliers de développeurs s'entraident chaque jour sur DevHelp.
          Ton prochain déblocage est peut-être à une question de distance.
        </motion.p>

        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/auth/register">
              <Button size="lg" className="gap-2 text-base px-8 shadow-md hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
                Rejoindre gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/forum">
              <Button size="lg" variant="outline" className="text-base px-8 hover:border-primary/40 transition-colors duration-300">
                Parcourir sans compte
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
