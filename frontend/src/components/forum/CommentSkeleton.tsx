import { Skeleton } from '@/components/ui/Skeleton'

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center gap-2 h-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-20 rounded-full mt-1" />
      </div>
    </div>
  )
}
