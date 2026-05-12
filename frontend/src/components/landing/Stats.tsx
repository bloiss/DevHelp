import { useRef, useEffect, useState } from 'react'
import { Users, MessageSquare, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { stagger, fadeInUp } from '@/lib/animations'

const STATS = [
  { icon: Users,         target: 1200, suffix: '+',  label: 'Membres actifs'      },
  { icon: MessageSquare, target: 4800, suffix: '+',  label: 'Discussions'         },
  { icon: LayoutGrid,    target: 10,   suffix: '',   label: 'Rubriques'           },
  { icon: CheckCircle2,  target: 98,   suffix: ' %', label: 'Questions résolues'  },
]

function useCountUp(target: number, inView: boolean, duration = 1.6) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return value
}

function StatItem({
  icon: Icon, target, suffix, label,
}: typeof STATS[number]) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const count = useCountUp(target, inView)

  const display = target >= 1000
    ? new Intl.NumberFormat('fr-FR').format(count)
    : String(count)

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      className="flex flex-col items-center gap-2 text-center"
    >
      <motion.div
        className="p-2 rounded-lg bg-primary/10 text-primary"
        whileHover={{ scale: 1.15, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      <span className="text-2xl font-bold tracking-tight tabular-nums">
        {display}{suffix}
      </span>

      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  )
}

export function Stats() {
  return (
    <section className="border-y border-border bg-muted/40">
      <motion.div
        className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {STATS.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </motion.div>
    </section>
  )
}
