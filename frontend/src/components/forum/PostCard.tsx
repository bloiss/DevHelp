import { Link } from '@tanstack/react-router'
import { MessageSquare, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/shared/Avatar'
import { TagList } from '@/components/shared/TagBadge'
import { cn, formatRelativeDate } from '@/lib/utils'
import { getCategoryBySlug } from '@/data/categories'
import { inferTags } from '@/data/postTags'
import type { Post } from '@/types/post'

interface PostCardProps {
  post: Post
  categorySlug: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function PostCard({ post, categorySlug }: PostCardProps) {
  const plain    = stripHtml(post.content)
  const excerpt  = plain.length > 200 ? plain.slice(0, 200).trimEnd() + '…' : plain
  const votes    = post.vote_count ?? 0
  const comments = post.comment_count ?? 0
  const category = getCategoryBySlug(post.category?.slug ?? categorySlug)
  const Icon     = category?.icon
  const tags     = post.tags?.length ? post.tags : inferTags(post.category?.slug ?? categorySlug, post.title)

  const postLink = {
    to: '/forum/$category/$postId' as const,
    params: { category: categorySlug, postId: post.id },
  }

  return (
    <motion.article
      whileHover={{ backgroundColor: 'hsl(var(--accent) / 0.4)' }}
      transition={{ duration: 0.15 }}
      className="flex gap-3 px-4 py-3 border-b border-border cursor-pointer"
    >
      {/* ── Colonne gauche : avatar ── */}
      <div className="shrink-0 pt-0.5">
        <Link to="/profile/$username" params={{ username: post.author.username }} onClick={(e) => e.stopPropagation()}>
          <Avatar user={post.author} size="md" className="h-10 w-10 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all" />
        </Link>
      </div>

      {/* ── Colonne droite : tout le contenu ── */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">

        {/* Ligne 1 : username · date · badge catégorie */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link to="/profile/$username" params={{ username: post.author.username }} onClick={(e) => e.stopPropagation()} className="font-bold text-sm text-foreground hover:underline">{post.author.username}</Link>
          {post.author.role !== 'user' && (
            <Badge
              className="text-[10px] px-1.5 py-0"
              style={{ background: 'var(--gold-soft)', color: 'var(--gold)', borderColor: 'var(--gold-border)', border: '1px solid' }}
            >
              {post.author.role === 'moderator' ? 'Modo' : 'Admin'}
            </Badge>
          )}
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">{formatRelativeDate(post.created_at)}</span>
          {category && Icon && (
            <>
              <span className="text-muted-foreground text-sm">·</span>
              <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium', category.color)}>
                <Icon className="h-2.5 w-2.5" />
                <span>{category.name}</span>
              </div>
            </>
          )}
        </div>

        {/* Ligne 2 : titre */}
        <Link
          {...postLink}
          className="font-bold text-[15px] leading-snug hover:text-primary transition-colors duration-150 line-clamp-2"
        >
          {post.title}
        </Link>

        {/* Ligne 3 : extrait */}
        {excerpt && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Ligne 3b : tags */}
        {tags.length > 0 && <TagList tags={tags} max={3} className="mt-0.5" />}

        {/* Ligne 4 : barre d'actions style Twitter */}
        <div className="flex items-center justify-between mt-1 -ml-2 max-w-xs">

          {/* Commentaires */}
          <Link
            {...postLink}
            className="group/btn flex items-center gap-1.5 p-2 rounded-full text-muted-foreground
              hover:text-sky-500 hover:bg-sky-500/10 transition-colors duration-150 min-w-[36px]"
          >
            <MessageSquare className="h-[18px] w-[18px] shrink-0" />
            <span className="text-xs tabular-nums group-hover/btn:text-sky-500 w-4 text-left">
              {comments > 0 ? comments : ''}
            </span>
          </Link>

          {/* Vote up */}
          <button
            className={cn(
              'group/up flex items-center gap-1.5 p-2 rounded-full transition-colors duration-150 min-w-[36px]',
              post.user_vote === 1
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10',
            )}
          >
            <ThumbsUp className="h-[18px] w-[18px] shrink-0" />
            <span className={cn('text-xs tabular-nums w-4 text-left', post.user_vote === 1 ? 'text-emerald-500' : 'group-hover/up:text-emerald-500')}>
              {votes > 0 ? votes : ''}
            </span>
          </button>

          {/* Vote down */}
          <button
            className={cn(
              'p-2 rounded-full transition-colors duration-150',
              post.user_vote === -1
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10',
            )}
          >
            <ThumbsDown className="h-[18px] w-[18px]" />
          </button>

          {/* Partager */}
          <button
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard?.writeText(
                window.location.origin + `/forum/${categorySlug}/${post.id}`,
              )
            }}
            className="p-2 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-colors duration-150"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
