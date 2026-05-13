import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: SplashPage,
})

function SplashPage() {
  const navigate = useNavigate()

  function enter() {
    navigate({ to: '/home' })
  }

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden select-none">

      {/* ── Ambient background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Gold orb — top center */}
        <motion.div
          className="absolute top-[-8%] left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full blur-[120px]"
          style={{ background: 'var(--gold-glow)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary orb — bottom */}
        <motion.div
          className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full blur-[100px]"
          style={{ background: 'var(--gold-soft)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.25]" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background)/0.7)_100%)]" />
      </div>

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
        }}
      >
        {/* Logo + Name */}
        <motion.div
          className="flex flex-col items-center gap-5"
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
        >
          <motion.div
            className="relative flex items-center justify-center"
            animate={{ rotate: [0, 8, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          >
            {/* Icon glow ring */}
            <div
              className="absolute inset-[-8px] rounded-2xl blur-[18px] opacity-60"
              style={{ background: 'var(--gold-glow)' }}
            />
            <div
              className="relative p-4 rounded-2xl border"
              style={{
                background: 'var(--gold-soft)',
                borderColor: 'var(--gold-border)',
                color: 'var(--gold)',
              }}
            >
              <Code2 className="h-9 w-9" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">DevHelp</h1>
            <p className="text-base text-muted-foreground tracking-wide">
              La communauté des développeurs
            </p>
          </div>
        </motion.div>

        {/* Divider line */}
        <motion.div
          variants={{ hidden: { opacity: 0, scaleX: 0 }, visible: { opacity: 1, scaleX: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } } }}
          className="h-px w-20 origin-center"
          style={{ background: 'var(--gold-border)' }}
        />

        {/* Enter button */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } } }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Button
              size="lg"
              onClick={enter}
              className="px-12 text-base tracking-wide"
            >
              Entrer
            </Button>
          </motion.div>
        </motion.div>

        {/* Small hint */}
        <motion.p
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } }}
          className="text-xs text-muted-foreground/50 tracking-widest uppercase"
        >
          Apprends · Partage · Progresse
        </motion.p>
      </motion.div>
    </div>
  )
}
