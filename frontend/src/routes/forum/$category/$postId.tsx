import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { BackButton } from '@/components/shared/BackButton'
import { VoteButtons } from '@/components/forum/VoteButtons'
import { CommentItem } from '@/components/forum/CommentItem'
import { CommentForm } from '@/components/forum/CommentForm'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { getCategoryBySlug } from '@/data/categories'
import { postService } from '@/services/post.service'
import { formatRelativeDate } from '@/lib/utils'

export const Route = createFileRoute('/forum/$category/$postId')({
  component: PostPage,
})

function PostPage() {
  const { category: slug, postId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.get(postId),
  })

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!post,
  })

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => postService.vote(postId, value),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => postService.createComment(postId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-5 w-28 bg-muted animate-pulse rounded mb-6" />
        <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        <div className="space-y-2 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !post) throw notFound()

  const category = getCategoryBySlug(slug)
  const Icon = category?.icon

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <BackButton label={category ? `Retour à ${category.name}` : 'Retour'} className="mb-6" />

      {/* Post */}
      <article className="flex gap-5">

        {/* Votes — colonne gauche */}
        <div className="hidden sm:flex flex-col items-center pt-1">
          <VoteButtons
            score={post.vote_count ?? 0}
            userVote={post.user_vote ?? null}
            onVote={(value) => voteMutation.mutate(value)}
            orientation="vertical"
          />
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* Badge catégorie */}
          {category && Icon && (
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${category.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">{category.name}</span>
            </div>
          )}

          {/* Titre */}
          <h1 className="text-2xl font-bold tracking-tight leading-snug">
            {post.title}
          </h1>

          {/* Auteur + date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar user={post.author} size="sm" />
            <span className="font-medium text-foreground">{post.author.username}</span>
            {post.author.role !== 'user' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {post.author.role === 'moderator' ? 'Modo' : 'Admin'}
              </Badge>
            )}
            <span>·</span>
            <span>{formatRelativeDate(post.created_at)}</span>
          </div>

          {/* Contenu du post */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Votes mobile */}
          <div className="flex sm:hidden">
            <VoteButtons
              score={post.vote_count ?? 0}
              userVote={post.user_vote ?? null}
              onVote={(value) => voteMutation.mutate(value)}
              orientation="horizontal"
            />
          </div>
        </div>
      </article>

      {/* Séparateur commentaires */}
      <div className="flex items-center gap-3 mt-10 mb-6">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-base">
          {comments.length} commentaire{comments.length > 1 ? 's' : ''}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Formulaire */}
      <div className="mb-8">
        <CommentForm onSubmit={(content) => commentMutation.mutateAsync(content)} />
      </div>

      {/* Liste des commentaires */}
      {commentsLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 py-4">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">
          Aucun commentaire pour l'instant. Sois le premier à répondre !
        </p>
      )}
    </div>
  )
}
