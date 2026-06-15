import { Skeleton } from '@/components/ui/Skeleton'

export function PostCardSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-full shrink-0 mt-0.5" />

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 h-5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>

        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        <Skeleton className="h-3 w-full mt-0.5" />
        <Skeleton className="h-3 w-5/6" />

        <div className="flex items-center gap-1 mt-1 -ml-2">
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  )
}
