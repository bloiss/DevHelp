import { useRef, useEffect, useState } from 'react'
import { Users, MessageSquare, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { stagger, fadeInUp } from '@/lib/animations'
import { api } from '@/lib/api'

const STAT_DEFS = [
  { icon: Users,         key: 'users'      as const, suffix: '+', label: 'Membres'      },
  { icon: MessageSquare, key: 'posts'       as const, suffix: '+', label: 'Discussions'  },
  { icon: CheckCircle2,  key: 'comments'    as const, suffix: '+', label: 'Réponses'     },
  { icon: LayoutGrid,    key: 'categories'  as const, suffix: '',  label: 'Rubriques'    },
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
}: { icon: typeof Users; target: number; suffix: string; label: string }) {
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
        className="p-2 rounded-lg"
        style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
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
  const [data, setData] = useState({ users: 0, posts: 0, comments: 0, categories: 0 })

  useEffect(() => {
    api.get<{ users: number; posts: number; comments: number; categories: number }>('/stats')
      .then((r) => setData(r.data))
      .catch(() => {})
  }, [])

  return (
    <section className="border-y border-border bg-muted/40">
      <motion.div
        className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {STAT_DEFS.map((def) => (
          <StatItem key={def.label} icon={def.icon} target={data[def.key]} suffix={def.suffix} label={def.label} />
        ))}
      </motion.div>
    </section>
  )
}
