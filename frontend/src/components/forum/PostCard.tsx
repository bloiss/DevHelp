import { Link } from '@tanstack/react-router'
import { ArrowUp, MessageSquare, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { Post } from '@/types/post'

interface PostCardProps {
  post: Post
  categorySlug: string
}

export function PostCard({ post, categorySlug }: PostCardProps) {
  const excerpt = post.content.length > 160
    ? post.content.slice(0, 160).trimEnd() + '…'
    : post.content

  return (
    <motion.article
      whileHover={{ y: -2, boxShadow: '0 6px 24px hsl(var(--primary) / 0.07)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="group flex gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/25 transition-colors duration-200"
    >
      {/* Score votes */}
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
          <ArrowUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          (post.vote_count ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {post.vote_count ?? 0}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar user={post.author} size="sm" />
          <span className="font-medium text-foreground">{post.author.username}</span>
          {post.author.role !== 'user' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {post.author.role === 'moderator' ? 'Modo' : 'Admin'}
            </Badge>
          )}
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(post.created_at)}
          </span>
        </div>

        <Link
          to="/forum/$category/$postId"
          params={{ category: categorySlug, postId: post.id }}
          className="font-semibold text-base leading-snug hover:text-primary transition-colors line-clamp-2"
        >
          {post.title}
        </Link>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {excerpt}
        </p>

        <div className="flex items-center gap-4 mt-1">
          <Link
            to="/forum/$category/$postId"
            params={{ category: categorySlug, postId: post.id }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count ?? 0} commentaire{(post.comment_count ?? 0) > 1 ? 's' : ''}
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
