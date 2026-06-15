import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  likeCount: number
  dislikeCount: number
  userVote: 1 | -1 | null
  onVote?: (value: 1 | -1) => void
  orientation?: 'vertical' | 'horizontal'
}

export function VoteButtons({ likeCount, dislikeCount, userVote, onVote, orientation = 'vertical' }: VoteButtonsProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div className={cn(
      'flex items-center gap-1.5',
      isVertical ? 'flex-col' : 'flex-row',
    )}>
      <button
        onClick={() => onVote?.(1)}
        aria-label="J'aime"
        className={cn(
          'flex items-center gap-1 p-1.5 rounded-full transition-colors',
          userVote === 1
            ? 'text-emerald-500 bg-emerald-500/10'
            : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10',
        )}
      >
        <ThumbsUp className={cn(isVertical ? 'h-5 w-5' : 'h-4 w-4', userVote === 1 && 'fill-emerald-500/20')} />
        {likeCount > 0 && (
          <span className={cn('font-semibold tabular-nums select-none', isVertical ? 'text-base' : 'text-sm')}>
            {likeCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onVote?.(-1)}
        aria-label="Je n'aime pas"
        className={cn(
          'flex items-center gap-1 p-1.5 rounded-full transition-colors',
          userVote === -1
            ? 'text-rose-500 bg-rose-500/10'
            : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10',
        )}
      >
        <ThumbsDown className={cn(isVertical ? 'h-5 w-5' : 'h-4 w-4', userVote === -1 && 'fill-rose-500/20')} />
        {dislikeCount > 0 && (
          <span className={cn('font-semibold tabular-nums select-none', isVertical ? 'text-base' : 'text-sm')}>
            {dislikeCount}
          </span>
        )}
      </button>
    </div>
  )
}
