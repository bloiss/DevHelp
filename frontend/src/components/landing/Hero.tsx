import { Link } from '@tanstack/react-router'
import { ArrowRight, Code2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { fadeInUp, stagger } from '@/lib/animations'

export function Hero() {
  return (
    <section className="relative overflow-hidden flex-1 flex flex-col justify-center py-16 px-4">

      {/* Fond : orbes animés */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <motion.div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-[15%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4], x: [-8, 8, -8] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </div>

      {/* Contenu */}
      <motion.div
        className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          variants={fadeInUp}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted/80 text-sm text-muted-foreground backdrop-blur-sm hover:border-gold/40 transition-colors duration-300"
        >
          <Code2 className="h-3.5 w-3.5 text-primary" />
          <span>La communauté des développeurs</span>
        </motion.div>

        {/* Titre */}
        <motion.h1
          variants={fadeInUp}
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight"
        >
          Apprends, Partage et{' '}
          <motion.span
            className="text-primary inline-block"
            animate={{
              textShadow: [
                '0 0 0px hsl(var(--primary) / 0)',
                '0 0 24px hsl(var(--primary) / 0.35)',
                '0 0 0px hsl(var(--primary) / 0)',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          >
            Progresse.
          </motion.span>
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          variants={fadeInUp}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          DevHelp est le forum pensé pour les développeurs. Pose tes questions,
          partage tes découvertes et aide la communauté à grandir.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 mt-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/forum">
              <Button size="lg" className="gap-2 text-base px-8 shadow-md hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
                Explorer le forum
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/auth/register">
              <Button size="lg" variant="outline" className="text-base px-8 hover:border-primary/40 transition-colors duration-300">
                Créer un compte
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
