import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  score: number
  userVote: 1 | -1 | null
  onVote?: (value: 1 | -1) => void
  orientation?: 'vertical' | 'horizontal'
}

export function VoteButtons({ score, userVote, onVote, orientation = 'vertical' }: VoteButtonsProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div className={cn(
      'flex items-center gap-1',
      isVertical ? 'flex-col' : 'flex-row',
    )}>
      <button
        onClick={() => onVote?.(1)}
        aria-label="Voter pour"
        className={cn(
          'p-1.5 rounded-md transition-colors',
          userVote === 1
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
        )}
      >
        <ArrowUp className={isVertical ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>

      <span className={cn(
        'font-semibold tabular-nums select-none',
        isVertical ? 'text-base' : 'text-sm',
        score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground',
      )}>
        {score}
      </span>

      <button
        onClick={() => onVote?.(-1)}
        aria-label="Voter contre"
        className={cn(
          'p-1.5 rounded-md transition-colors',
          userVote === -1
            ? 'text-destructive bg-destructive/10'
            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
        )}
      >
        <ArrowDown className={isVertical ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>
    </div>
  )
}
