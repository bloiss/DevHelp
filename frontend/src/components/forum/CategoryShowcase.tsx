import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, PenSquare, ArrowRight } from 'lucide-react'
import {
  motion,
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

interface CategoryShowcaseProps {
  categories: CategoryMeta[]
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduced = useReducedMotion() ?? false
  const count = categories.length

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useTransform(my, [-0.5, 0.5], reduced ? [0, 0] : [7, -7])
  const tiltY = useTransform(mx, [-0.5, 0.5], reduced ? [0, 0] : [-7, 7])

  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + count) % count), [count])
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % count), [count])

  // Reset tilt when active card changes
  useEffect(() => {
    animate(mx, 0, { duration: 0.35, ease: 'easeOut' })
    animate(my, 0, { duration: 0.35, ease: 'easeOut' })
  }, [activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (count === 0) return null

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    animate(mx, (e.clientX - rect.left) / rect.width - 0.5, { duration: 0.12 })
    animate(my, (e.clientY - rect.top) / rect.height - 0.5, { duration: 0.12 })
  }

  function onMouseLeave() {
    animate(mx, 0, { duration: 0.5, ease: 'easeOut' })
    animate(my, 0, { duration: 0.5, ease: 'easeOut' })
  }

  const spring = reduced
    ? ({ type: 'tween', duration: 0 } as const)
    : ({ type: 'spring', stiffness: 280, damping: 28 } as const)

  return (
    <div className="w-full select-none">
      {/* Stage */}
      <div
        className="relative w-full h-[460px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1400px' }}
      >
        {categories.map((cat, i) => {
          const Icon = cat.icon

          // Compute wrapped, signed offset from center
          let offset = ((i - activeIndex) % count + count) % count
          if (offset > count / 2) offset -= count
          const abs = Math.abs(offset)
          const side = offset < 0 ? -1 : offset > 0 ? 1 : 0
          const isActive = offset === 0

          // Position config per depth level
          let x: string, scale: number, rotY: number, opacity: number, blur: number, zIndex: number
          if (isActive) {
            x = '0%'; scale = 1; rotY = 0; opacity = 1; blur = 0; zIndex = 10
          } else if (abs === 1) {
            x = `${side * 54}%`; scale = 0.8; rotY = reduced ? 0 : side * -18; opacity = 0.68; blur = 1.5; zIndex = 5
          } else if (abs === 2) {
            x = `${side * 86}%`; scale = 0.6; rotY = reduced ? 0 : side * -30; opacity = 0.28; blur = 3.5; zIndex = 1
          } else {
            // Hidden — park off-screen on the correct side
            x = `${(side || 1) * 115}%`; scale = 0.55; rotY = 0; opacity = 0; blur = 6; zIndex = 0
          }

          return (
            <motion.div
              key={cat.slug}
              className="absolute"
              style={{ zIndex }}
              animate={{ x, scale, rotateY: rotY, opacity }}
              transition={spring}
            >
              {/* Blur wrapper (CSS transition, avoids FM filter quirks) */}
              <div
                style={{
                  filter: `blur(${blur}px)`,
                  transition: reduced ? 'none' : 'filter 0.35s ease',
                }}
              >
                {isActive ? (
                  /* ── Active card: 3D tilt + full content + drag ── */
                  <motion.div
                    className="w-[300px] sm:w-[360px]"
                    style={{
                      rotateX: tiltX,
                      rotateY: tiltY,
                      transformStyle: 'preserve-3d',
                    }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.12}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) next()
                      else if (info.offset.x > 60) prev()
                    }}
                  >
                    <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
                      <div className="p-7">
                        <div className="flex items-start justify-between mb-5">
                          <div className={cn('p-4 rounded-2xl', cat.color)}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {PILLAR_LABEL[cat.pillar] ?? cat.pillar}
                          </Badge>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2.5">{cat.name}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-7">
                          {cat.description}
                        </p>
                        <div className="flex gap-2">
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
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Side card: minimal preview, click to focus ── */
                  <button
                    className={cn(
                      'w-[240px] sm:w-[272px] text-left rounded-2xl',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      abs >= 2 && 'pointer-events-none',
                    )}
                    onClick={() => setActiveIndex(i)}
                    tabIndex={abs === 1 ? 0 : -1}
                    aria-label={`Voir la rubrique ${cat.name}`}
                  >
                    <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/20 transition-colors">
                      <div className={cn('p-3 rounded-xl w-fit mb-4', cat.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-base">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          onClick={prev}
          aria-label="Rubrique précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Pill dots */}
        <div className="flex items-center gap-1.5">
          {categories.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Aller à la rubrique ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-300 focus-visible:outline-none',
                i === activeIndex
                  ? 'bg-primary h-2 w-5'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/60 h-2 w-2',
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          onClick={next}
          aria-label="Rubrique suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
