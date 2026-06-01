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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function PostCard({ post, categorySlug }: PostCardProps) {
  const plain = stripHtml(post.content)
  const excerpt = plain.length > 160 ? plain.slice(0, 160).trimEnd() + '…' : plain

  const votes = post.vote_count ?? 0

  return (
    <motion.article
      whileHover={{
        y: -3,
        boxShadow: '0 8px 32px var(--gold-glow), 0 2px 8px oklch(from var(--gold) l c h / 0.06)',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="group relative flex gap-4 p-5 rounded-xl border border-border bg-card/90
        hover:border-primary/30 transition-colors duration-200 overflow-hidden
        dark:hover:shadow-[0_8px_32px_hsl(0_0%_0%/0.35)]"
    >
      {/* Left accent bar — slides in on hover */}
      <div className="absolute left-0 inset-y-0 w-[2px] bg-primary
        scale-y-0 group-hover:scale-y-100 origin-center
        transition-transform duration-300 ease-out rounded-r-full" />

      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <motion.div
          whileHover={{ scale: 1.25, y: -1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        >
          <ArrowUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
        </motion.div>
        <motion.span
          key={votes}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={cn(
            'text-sm font-semibold tabular-nums',
            votes > 10 ? 'text-gold'
            : votes > 0 ? 'text-foreground'
            : 'text-muted-foreground',
          )}
        >
          {votes}
        </motion.span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar user={post.author} size="sm" />
          <span className="font-medium text-foreground">{post.author.username}</span>
          {post.author.role !== 'user' && (
            <Badge className="text-[10px] px-1.5 py-0 bg-gold/15 text-gold border-gold/30 border" style={{ background: 'var(--gold-soft)', color: 'var(--gold)', borderColor: 'var(--gold-border)' }}>
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
          className="font-semibold text-base leading-snug hover:text-primary transition-colors duration-200 line-clamp-2"
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
            className="flex items-center gap-1.5 text-xs text-muted-foreground
              hover:text-foreground transition-colors duration-200 group/comments"
          >
            <MessageSquare className="h-3.5 w-3.5 transition-transform duration-200 group-hover/comments:scale-110" />
            {post.comment_count ?? 0} commentaire{(post.comment_count ?? 0) > 1 ? 's' : ''}
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
