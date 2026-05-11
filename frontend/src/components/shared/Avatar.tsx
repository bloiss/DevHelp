import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

interface AvatarProps {
  user: Pick<User, 'username' | 'avatar_url'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const initials = user.username.slice(0, 2).toUpperCase()

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center shrink-0',
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}
