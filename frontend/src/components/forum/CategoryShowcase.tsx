import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, PenSquare, ArrowRight, MoveHorizontal } from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CategoryMeta } from '@/data/categories'

const PILLAR_LABEL: Record<string, string> = {
  dev: 'Développement',
  community: 'Communauté',
}

// Spring presets
const SPRING_CAROUSEL = { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 } as const
const SPRING_FAST     = { type: 'spring', stiffness: 420, damping: 38 } as const

// Inner content variants (stagger on card activation)
const contentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.06, delayChildren: 0.04 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } },
}

interface CategoryShowcaseProps {
  categories: CategoryMeta[]
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const reduced = useReducedMotion() ?? false
  const count = categories.length
  const stageRef = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useTransform(my, [-0.5, 0.5], reduced ? [0, 0] : [6, -6])
  const tiltY = useTransform(mx, [-0.5, 0.5], reduced ? [0, 0] : [-6, 6])

  const dismissHint = useCallback(() => setShowHint(false), [])

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + count) % count)
    dismissHint()
  }, [count, dismissHint])

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count)
    dismissHint()
  }, [count, dismissHint])

  // Auto-hide hint after 5 s
  useEffect(() => {
    const t = setTimeout(dismissHint, 5000)
    return () => clearTimeout(t)
  }, [dismissHint])

  // Reset tilt on card change
  useEffect(() => {
    animate(mx, 0, { duration: 0.4, ease: 'easeOut' })
    animate(my, 0, { duration: 0.4, ease: 'easeOut' })
  }, [activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  // Wheel / trackpad horizontal scroll
  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    let accum = 0
    let locked = false
    let resetTimer: ReturnType<typeof setTimeout>
    const THRESHOLD = 120   // px of accumulated horizontal movement required
    const COOLDOWN   = 500  // ms locked after a navigation fires

    function onWheel(e: WheelEvent) {
      const adx = Math.abs(e.deltaX)
      const ady = Math.abs(e.deltaY)

      // Vertical scroll is dominant → let the page scroll normally
      if (adx <= ady) return
      // Horizontal movement too small to be intentional → ignore
      if (adx < 8) return

      // From here we own this gesture
      e.preventDefault()

      if (locked) return

      accum += e.deltaX

      // Reset accumulator if the user pauses between events
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { accum = 0 }, 350)

      if (accum > THRESHOLD) {
        next()
        accum = 0
        locked = true
        setTimeout(() => { locked = false }, COOLDOWN)
      } else if (accum < -THRESHOLD) {
        prev()
        accum = 0
        locked = true
        setTimeout(() => { locked = false }, COOLDOWN)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(resetTimer)
    }
  }, [next, prev])

  if (count === 0) return null

  function onTiltMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    animate(mx, (e.clientX - rect.left) / rect.width - 0.5, { duration: 0.1 })
    animate(my, (e.clientY - rect.top) / rect.height - 0.5, { duration: 0.1 })
  }

  function onTiltLeave() {
    animate(mx, 0, { duration: 0.55, ease: 'easeOut' })
    animate(my, 0, { duration: 0.55, ease: 'easeOut' })
  }

  return (
    <div className="w-full select-none">
      {/* Stage */}
      <motion.div
        ref={stageRef}
        className="relative w-full h-[460px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1400px' }}
        // Pan gesture (swipe / mouse drag across entire stage)
        onPanEnd={(_, info) => {
          const dx = info.offset.x
          const dy = Math.abs(info.offset.y)
          // Require clear horizontal intent: 80 px minimum + horizontal dominance
          if (Math.abs(dx) > 80 && Math.abs(dx) > dy * 1.8) {
            if (dx < 0) next()
            else prev()
          }
        }}
      >
        {/* Subtle ambient glow behind center */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-64 h-40 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(ellipse, hsl(var(--primary)/0.08) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
        </div>

        {categories.map((cat, i) => {
          const Icon = cat.icon

          let offset = ((i - activeIndex) % count + count) % count
          if (offset > count / 2) offset -= count
          const abs = Math.abs(offset)
          const side = offset < 0 ? -1 : offset > 0 ? 1 : 0
          const isActive = offset === 0

          let x: string, scale: number, rotY: number, opacity: number, blur: number, zIndex: number
          if (isActive) {
            x = '0%'; scale = 1; rotY = 0; opacity = 1; blur = 0; zIndex = 10
          } else if (abs === 1) {
            x = `${side * 54}%`; scale = 0.8; rotY = reduced ? 0 : side * -18; opacity = 0.65; blur = 1.5; zIndex = 5
          } else if (abs === 2) {
            x = `${side * 86}%`; scale = 0.6; rotY = reduced ? 0 : side * -30; opacity = 0.25; blur = 4; zIndex = 1
          } else {
            x = `${(side || 1) * 115}%`; scale = 0.55; rotY = 0; opacity = 0; blur = 6; zIndex = 0
          }

          return (
            <motion.div
              key={cat.slug}
              className="absolute"
              style={{ zIndex }}
              animate={{ x, scale, rotateY: rotY, opacity }}
              transition={reduced ? { type: 'tween', duration: 0 } : SPRING_CAROUSEL}
            >
              <div
                style={{
                  filter: `blur(${blur}px)`,
                  transition: reduced ? 'none' : 'filter 0.4s ease',
                }}
              >
                <AnimatePresence initial={false} mode="wait">
                  {isActive ? (
                    /* ── Active card ── */
                    <motion.div
                      key="active"
                      className="w-[300px] sm:w-[360px]"
                      style={{
                        rotateX: tiltX,
                        rotateY: tiltY,
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseMove={onTiltMove}
                      onMouseLeave={onTiltLeave}
                    >
                      <motion.div
                        className="rounded-2xl border border-border bg-card overflow-hidden
                          shadow-[0_12px_48px_hsl(0_0%_0%/0.12),0_2px_8px_hsl(0_0%_0%/0.06)]
                          dark:shadow-[0_16px_56px_hsl(0_0%_0%/0.5),0_0_0_1px_hsl(0_0%_100%/0.07)]
                          cursor-grab active:cursor-grabbing"
                        whileHover={{
                          boxShadow: '0 20px 64px hsl(var(--primary)/0.14), 0 4px 16px hsl(0 0% 0%/0.08)',
                          borderColor: 'hsl(var(--primary)/0.25)',
                        }}
                        transition={SPRING_FAST}
                      >
                        {/* Color accent strip */}
                        <div className={cn('h-1', cat.color)} />

                        <motion.div
                          className="p-7"
                          variants={reduced ? undefined : contentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <motion.div
                            className="flex items-start justify-between mb-5"
                            variants={reduced ? undefined : itemVariant}
                          >
                            <motion.div
                              className={cn('p-4 rounded-2xl', cat.color)}
                              whileHover={{ scale: 1.1, rotate: 8 }}
                              transition={SPRING_FAST}
                            >
                              <Icon className="h-8 w-8" />
                            </motion.div>
                            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                              {PILLAR_LABEL[cat.pillar] ?? cat.pillar}
                            </Badge>
                          </motion.div>

                          <motion.h2
                            className="text-2xl font-bold tracking-tight mb-2.5"
                            variants={reduced ? undefined : itemVariant}
                          >
                            {cat.name}
                          </motion.h2>

                          <motion.p
                            className="text-sm text-muted-foreground leading-relaxed mb-7"
                            variants={reduced ? undefined : itemVariant}
                          >
                            {cat.description}
                          </motion.p>

                          <motion.div
                            className="flex gap-2"
                            variants={reduced ? undefined : itemVariant}
                          >
                            <Link to="/forum/$category" params={{ category: cat.slug }} className="flex-1">
                              <Button size="sm" className="w-full gap-2">
                                <ArrowRight className="h-3.5 w-3.5" />
                                Voir les posts
                              </Button>
                            </Link>
                            <Link to="/forum/new">
                              <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                                <PenSquare className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Nouveau</span>
                              </Button>
                            </Link>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* ── Side card ── */
                    <motion.button
                      key="side"
                      className={cn(
                        'w-[240px] sm:w-[272px] text-left rounded-2xl',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        abs >= 2 && 'pointer-events-none',
                      )}
                      onClick={() => { setActiveIndex(i); dismissHint() }}
                      tabIndex={abs === 1 ? 0 : -1}
                      aria-label={`Voir la rubrique ${cat.name}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      whileHover={abs === 1 ? { scale: 1.02 } : undefined}
                    >
                      <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/25 transition-colors duration-200">
                        <div className={cn('p-3 rounded-xl w-fit mb-4', cat.color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-base leading-snug">{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={prev}
              aria-label="Rubrique précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Pill dots */}
          <div className="flex items-center gap-1.5">
            {categories.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => { setActiveIndex(i); dismissHint() }}
                aria-label={`Aller à la rubrique ${i + 1}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                animate={{
                  width: i === activeIndex ? 20 : 8,
                  backgroundColor: i === activeIndex
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground)/0.3)',
                }}
                whileHover={i !== activeIndex ? { backgroundColor: 'hsl(var(--muted-foreground)/0.6)' } : undefined}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{ height: 8 }}
              />
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={next}
              aria-label="Rubrique suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Drag hint */}
        <AnimatePresence>
          {showHint && (
            <motion.p
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 pointer-events-none"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 1.2, duration: 0.4 } }}
              exit={{ opacity: 0, y: 4, transition: { duration: 0.3 } }}
            >
              <MoveHorizontal className="h-3 w-3" />
              Glissez ou faites défiler pour explorer
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
