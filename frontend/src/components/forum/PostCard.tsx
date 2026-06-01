import { Link } from '@tanstack/react-router'
import { MessageSquare, ArrowUp, ArrowDown, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { cn, formatRelativeDate } from '@/lib/utils'
import { getCategoryBySlug } from '@/data/categories'
import type { Post } from '@/types/post'

interface PostCardProps {
  post: Post
  categorySlug: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function PostCard({ post, categorySlug }: PostCardProps) {
  const plain   = stripHtml(post.content)
  const excerpt = plain.length > 180 ? plain.slice(0, 180).trimEnd() + '…' : plain

  const votes       = post.vote_count ?? 0
  const commentCount = post.comment_count ?? 0
  const category    = getCategoryBySlug(post.category?.slug ?? categorySlug)
  const Icon        = category?.icon

  const postLink = { to: '/forum/$category/$postId' as const, params: { category: categorySlug, postId: post.id } }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="group relative rounded-xl border border-border bg-card/90
        hover:border-primary/25 hover:bg-card transition-all duration-200 overflow-hidden"
    >
      {/* Top accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 to-primary/0
        scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />

      <div className="p-5 flex flex-col gap-3">

        {/* ── Header: avatar + username + meta ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar user={post.author} size="sm" />
            <span className="text-sm font-semibold text-foreground truncate">{post.author.username}</span>
            {post.author.role !== 'user' && (
              <Badge
                className="text-[10px] px-1.5 py-0 shrink-0"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)', borderColor: 'var(--gold-border)', border: '1px solid' }}
              >
                {post.author.role === 'moderator' ? 'Modo' : 'Admin'}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              · {formatRelativeDate(post.created_at)}
            </span>
          </div>

          {/* Category badge */}
          {category && Icon && (
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0', category.color)}>
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{category.name}</span>
            </div>
          )}
        </div>

        {/* ── Title ── */}
        <Link
          {...postLink}
          className="font-bold text-[15px] leading-snug hover:text-primary transition-colors duration-200 line-clamp-2"
        >
          {post.title}
        </Link>

        {/* ── Excerpt ── */}
        {excerpt && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* ── Action bar (Twitter-style) ── */}
        <div className="flex items-center gap-1 pt-1 -mx-1">

          {/* Comments */}
          <Link
            {...postLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground
              hover:text-primary hover:bg-primary/8 transition-colors duration-150 group/btn"
          >
            <MessageSquare className="h-3.5 w-3.5 transition-transform duration-150 group-hover/btn:scale-110" />
            <span>{commentCount}</span>
          </Link>

          {/* Votes */}
          <div className="flex items-center rounded-full overflow-hidden">
            <button
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs transition-colors duration-150',
                post.user_vote === 1
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/8',
              )}
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span className={cn(
                'font-semibold tabular-nums',
                votes > 10 ? 'text-amber-500'
                : votes > 0 ? 'text-foreground'
                : 'text-muted-foreground',
              )}>
                {votes}
              </span>
            </button>
            <button
              className={cn(
                'flex items-center px-2.5 py-1.5 text-xs transition-colors duration-150',
                post.user_vote === -1
                  ? 'text-destructive bg-destructive/10'
                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/8',
              )}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Share */}
          <button
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard?.writeText(window.location.origin + `/forum/${categorySlug}/${post.id}`)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground
              hover:text-foreground hover:bg-muted/60 transition-colors duration-150 group/share ml-auto"
          >
            <Share2 className="h-3.5 w-3.5 transition-transform duration-150 group-hover/share:scale-110" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
