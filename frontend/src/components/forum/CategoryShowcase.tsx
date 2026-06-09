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
  type Variants,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CategoryMeta } from '@/data/categories'

const PILLAR_LABEL: Record<string, string> = {
  dev: 'Développement',
  community: 'Communauté',
}

// ─────────────────────────────────────────────────────────────────────────────
// Spring presets — depth-based parallax: active snaps first, side cards trail
// ─────────────────────────────────────────────────────────────────────────────
const SPRING = {
  active: { type: 'spring', stiffness: 220, damping: 30, mass: 1.0 },
  side1:  { type: 'spring', stiffness: 185, damping: 28, mass: 1.2 }, // slight lag
  side2:  { type: 'spring', stiffness: 150, damping: 26, mass: 1.5 }, // more lag
  snap:   { type: 'spring', stiffness: 260, damping: 30, mass: 0.85 },
} as const

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}
const itemVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
}

// ─────────────────────────────────────────────────────────────────────────────

interface CategoryShowcaseProps {
  categories: CategoryMeta[]
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showHint, setShowHint]       = useState(true)
  const reduced = useReducedMotion() ?? false
  const count   = categories.length
  const stageRef = useRef<HTMLDivElement>(null)

  // ── Tilt (active card only) ──────────────────────────────────────────────
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useTransform(my, [-0.5, 0.5], reduced ? [0, 0] : [6, -6])
  const tiltY = useTransform(mx, [-0.5, 0.5], reduced ? [0, 0] : [-6, 6])

  // ── Live drag offset — applied to ALL cards as a shared x shift ──────────
  // This makes the drag feel physical: cards move with the finger in real-time.
  // On release, this value springs back to 0 (with the pan velocity as momentum).
  const trackX = useMotionValue(0)
  // Reference to the in-flight snap animation so we can cancel it on re-grab
  const snapControls = useRef<{ stop: () => void } | null>(null)

  // ── Core navigation (discrete index change only) ─────────────────────────
  const dismissHint = useCallback(() => setShowHint(false), [])

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + count) % count)
    dismissHint()
  }, [count, dismissHint])

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count)
    dismissHint()
  }, [count, dismissHint])

  // Spring trackX to 0 (call after any navigation)
  const snapHome = useCallback((velocity = 0) => {
    if (reduced) { trackX.set(0); return }
    snapControls.current?.stop()
    snapControls.current = animate(trackX, 0, {
      ...SPRING.snap,
      velocity, // carry real gesture momentum into the snap
    }) as { stop: () => void }
  }, [reduced, trackX])

  // Reset tilt on card change
  useEffect(() => {
    animate(mx, 0, { duration: 0.4, ease: 'easeOut' })
    animate(my, 0, { duration: 0.4, ease: 'easeOut' })
  }, [activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { prev(); snapHome() }
      else if (e.key === 'ArrowRight') { next(); snapHome() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, snapHome])

  // ── Wheel / trackpad horizontal scroll ───────────────────────────────────
  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    let accum = 0
    let locked = false
    let resetTimer: ReturnType<typeof setTimeout>
    const THRESHOLD = 120
    const COOLDOWN  = 520

    function onWheel(e: WheelEvent) {
      const adx = Math.abs(e.deltaX)
      const ady = Math.abs(e.deltaY)
      if (adx <= ady) return   // vertical dominant → page scrolls
      if (adx < 8)   return   // noise
      e.preventDefault()
      if (locked) return

      accum += e.deltaX
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { accum = 0 }, 350)

      if (accum > THRESHOLD) {
        next()
        // Small physical "kick" so wheel nav feels as organic as drag
        if (!reduced) { trackX.set(-18); snapHome(0) }
        accum = 0
        locked = true
        setTimeout(() => { locked = false }, COOLDOWN)
      } else if (accum < -THRESHOLD) {
        prev()
        if (!reduced) { trackX.set(18); snapHome(0) }
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
  }, [next, prev, snapHome, trackX, reduced])

  // ── Tilt helpers ─────────────────────────────────────────────────────────
  function onTiltMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    animate(mx, (e.clientX - rect.left) / rect.width  - 0.5, { duration: 0.1 })
    animate(my, (e.clientY - rect.top)  / rect.height - 0.5, { duration: 0.1 })
  }
  function onTiltLeave() {
    animate(mx, 0, { duration: 0.55, ease: 'easeOut' })
    animate(my, 0, { duration: 0.55, ease: 'easeOut' })
  }

  if (count === 0) return null

  return (
    <div className="w-full select-none">

      {/* ── Stage ────────────────────────────────────────────────────────── */}
      <motion.div
        ref={stageRef}
        className="relative w-full h-[460px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1400px' }}

        // ── Pan / swipe / drag gesture on the entire stage ──────────────
        onPanStart={() => {
          // Cancel any in-flight snap so the user can "catch" the carousel
          snapControls.current?.stop()
        }}
        onPan={(_, info) => {
          // Cards move physically with the finger — 0.88 resistance gives slight drag feel
          if (!reduced) trackX.set(info.offset.x * 0.88)
        }}
        onPanEnd={(_, info) => {
          const dx = info.offset.x
          const vx = info.velocity.x

          // Trigger navigation if offset OR velocity crosses threshold
          if      (dx < -80 || vx < -420) { next(); snapHome(vx * 0.35) }
          else if (dx >  80 || vx >  420) { prev(); snapHome(vx * 0.35) }
          else                             { snapHome(vx * 0.35) } // snap back, no change
        }}
      >
        {/* Ambient glow behind center */}
        <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-64 h-40 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(ellipse, hsl(var(--primary)/0.07) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
        </div>

        {categories.map((cat, i) => {
          const Icon = cat.icon

          // Wrapped, signed offset from center
          let offset = ((i - activeIndex) % count + count) % count
          if (offset > count / 2) offset -= count
          const abs  = Math.abs(offset)
          const side = offset < 0 ? -1 : offset > 0 ? 1 : 0
          const isActive = offset === 0

          // Per-depth position + spring
          let x: string, scale: number, rotY: number, opacity: number, blur: number, zIndex: number
          let spring: (typeof SPRING)[keyof typeof SPRING]

          if (isActive) {
            x = '0%'; scale = 1; rotY = 0; opacity = 1; blur = 0; zIndex = 10
            spring = SPRING.active
          } else if (abs === 1) {
            x = `${side * 54}%`; scale = 0.8; rotY = reduced ? 0 : side * -18
            opacity = 0.65; blur = 1.5; zIndex = 5
            spring = SPRING.side1
          } else if (abs === 2) {
            x = `${side * 86}%`; scale = 0.6; rotY = reduced ? 0 : side * -30
            opacity = 0.25; blur = 4; zIndex = 1
            spring = SPRING.side2
          } else {
            x = `${(side || 1) * 115}%`; scale = 0.55; rotY = 0
            opacity = 0; blur = 6; zIndex = 0
            spring = SPRING.side2
          }

          return (
            // ── Outer: adds the live trackX offset (shared, all cards move together) ──
            <motion.div
              key={cat.slug}
              className="absolute"
              style={{ zIndex, x: trackX }}
            >
              {/* ── Inner: springs to its base position per depth-level spring ── */}
              <motion.div
                animate={{ x, scale, rotateY: rotY, opacity }}
                transition={reduced ? { type: 'tween', duration: 0 } : spring}
              >
                <div
                  style={{
                    filter: `blur(${blur}px)`,
                    transition: reduced ? 'none' : 'filter 0.4s ease',
                  }}
                >
                  <AnimatePresence initial={false} mode="wait">
                    {isActive ? (
                      /* ── Active card: 3D tilt + full content ─────────── */
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
                            dark:shadow-[0_16px_56px_hsl(0_0%_0%/0.5),0_0_0_1px_hsl(0_0%_100%/0.07)]"
                          whileHover={{
                            boxShadow: '0 20px 64px hsl(var(--primary)/0.13), 0 4px 16px hsl(0 0% 0%/0.08)',
                            borderColor: 'hsl(var(--primary)/0.25)',
                          }}
                          transition={SPRING.active}
                        >
                          <div className={cn('h-[3px]', cat.color)} />

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
                                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
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
                              <Link
                                to="/forum/$category"
                                params={{ category: cat.slug }}
                                className="flex-1"
                              >
                                <Button size="sm" className="w-full gap-2">
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  Voir les posts
                                </Button>
                              </Link>
                              <Link to="/forum/new" search={{ category: undefined }}>
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
                      /* ── Side card: minimal preview ───────────────────── */
                      <motion.button
                        key="side"
                        className={cn(
                          'w-[240px] sm:w-[272px] text-left rounded-2xl',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          abs >= 2 && 'pointer-events-none',
                        )}
                        onClick={() => {
                          setActiveIndex(i)
                          dismissHint()
                          snapHome()
                        }}
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
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-4">

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={() => { prev(); snapHome() }}
              aria-label="Rubrique précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Animated pill dots */}
          <div className="flex items-center gap-1.5">
            {categories.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  setActiveIndex(i)
                  dismissHint()
                  snapHome()
                }}
                aria-label={`Aller à la rubrique ${i + 1}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                animate={{
                  width: i === activeIndex ? 20 : 8,
                  backgroundColor: i === activeIndex
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground)/0.3)',
                }}
                whileHover={i !== activeIndex ? {
                  backgroundColor: 'hsl(var(--muted-foreground)/0.6)',
                } : undefined}
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
              onClick={() => { next(); snapHome() }}
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
