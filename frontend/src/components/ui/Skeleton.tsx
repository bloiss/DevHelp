import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent"
        style={{ animation: 'skeleton-wave 1.7s ease-in-out infinite' }}
      />
    </div>
  )
}
