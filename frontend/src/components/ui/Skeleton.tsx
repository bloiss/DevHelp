import React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)} style={style}>
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent"
        style={{ animation: 'skeleton-wave 1.7s ease-in-out infinite' }}
      />
    </div>
  )
}
