import { Skeleton } from '@/components/ui/Skeleton'

export function PostCardSkeleton() {
  return (
    <div className="flex gap-4 p-5 rounded-xl border border-border bg-card/90">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0 w-6">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-5" />
        <Skeleton className="h-3 w-3" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Author row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>

        {/* Title */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Excerpt */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Footer */}
        <Skeleton className="h-3 w-24 mt-1" />
      </div>
    </div>
  )
}
