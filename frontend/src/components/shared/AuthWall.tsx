import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { stagger, fadeInUp } from '@/lib/animations'

interface AuthWallProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function AuthWall({ icon, title, description }: AuthWallProps) {
  return (
    <motion.div
      className="flex-1 flex items-center justify-center px-4 py-16"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">

        {/* Icon glow */}
        <motion.div
          variants={fadeInUp}
          className="relative flex items-center justify-center"
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: 'var(--gold-glow)', transform: 'scale(2)' }}
          />
          <div
            className="relative p-5 rounded-2xl border"
            style={{
              background: 'var(--gold-soft)',
              borderColor: 'var(--gold-border)',
              color: 'var(--gold)',
            }}
          >
            {icon}
          </div>
        </motion.div>

        {/* Text */}
        <motion.div variants={fadeInUp} className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 w-full">
          <Link to="/auth/login" className="flex-1">
            <Button className="w-full">Se connecter</Button>
          </Link>
          <Link to="/auth/register" className="flex-1">
            <Button variant="outline" className="w-full">Créer un compte</Button>
          </Link>
        </motion.div>

        {/* Continue browsing */}
        <motion.p variants={fadeInUp} className="text-xs text-muted-foreground">
          Tu peux aussi{' '}
          <Link to="/forum" className="underline underline-offset-4 hover:text-foreground transition-colors">
            parcourir le forum sans compte
          </Link>
        </motion.p>
      </div>
    </motion.div>
  )
}
