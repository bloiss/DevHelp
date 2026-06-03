import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = 'Retour', className }: BackButtonProps) {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate({ to: '/forum' })
    }
  }

  return (
    <motion.button
      onClick={handleBack}
      whileHover={{ x: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </motion.button>
  )
}
