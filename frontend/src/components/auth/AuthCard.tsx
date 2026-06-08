import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Code2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { stagger, fadeInUp, scaleIn } from '@/lib/animations'

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  oauth?: ReactNode
  className?: string
}

export function AuthCard({ title, description, children, oauth, className }: AuthCardProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className={cn('w-full max-w-sm mx-auto flex flex-col gap-6', className)}
    >
      {/* Logo */}
      <motion.div variants={fadeInUp}>
        <Link to="/" className="flex items-center gap-2 font-bold text-xl justify-center group">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Code2 className="h-6 w-6 text-primary" />
          </motion.div>
          <span>DevHelp</span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        variants={scaleIn}
        className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6"
      >
        <motion.div variants={fadeInUp} className="text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">P{description}</p>
        </motion.div>

        {children}

        {oauth && (
          <motion.div variants={fadeInUp} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou continuer avec</span>
              <Separator className="flex-1" />
            </div>
            {oauth}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
