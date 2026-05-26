import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { BackButton } from '@/components/shared/BackButton'
import { VoteButtons } from '@/components/forum/VoteButtons'
import { CommentItem } from '@/components/forum/CommentItem'
import { CommentForm } from '@/components/forum/CommentForm'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/badge'
import { getCategoryBySlug } from '@/data/categories'
import { getMockPostsByCategory } from '@/data/mockPosts'
import { getMockComments } from '@/data/mockComments'
import { formatRelativeDate } from '@/lib/utils'
import type { Comment } from '@/types/post'

export const Route = createFileRoute('/forum/$category/$postId')({
  component: PostPage,
})

function PostPage() {
  const { category: slug, postId } = Route.useParams()

  const category = getCategoryBySlug(slug)
  const post = getMockPostsByCategory(slug).find((p) => p.id === postId)

  if (!category || !post) throw notFound()

  const [score, setScore] = useState(post.vote_count ?? 0)
  const [userVote, setUserVote] = useState<1 | -1 | null>(post.user_vote ?? null)
  const [comments, setComments] = useState<Comment[]>(getMockComments(postId))

  function handleVote(value: 1 | -1) {
    if (userVote === value) {
      // Annule le vote
      setScore((s) => s - value)
      setUserVote(null)
    } else {
      // Change ou pose le vote
      setScore((s) => s - (userVote ?? 0) + value)
      setUserVote(value)
    }
  }

  async function handleComment(content: string) {
    // Mock : ajoute le commentaire localement — remplacé par appel API en semaine 2
    const newComment: Comment = {
      id: `mock-${Date.now()}`,
      post_id: postId,
      user_id: 'me',
      content,
      status: 'approved',
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vote_count: 0,
      user_vote: null,
      author: { id: 'me', email: '', username: 'moi', role: 'user', email_verified: true, created_at: '', updated_at: '' },
    }
    setComments((prev) => [...prev, newComment])
  }

  const Icon = category.icon

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <BackButton label={`Retour à ${category.name}`} className="mb-6" />

      {/* Post */}
      <article className="flex gap-5">

        {/* Votes — colonne gauche */}
        <div className="hidden sm:flex flex-col items-center pt-1">
          <VoteButtons score={score} userVote={userVote} onVote={handleVote} orientation="vertical" />
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* Badge catégorie */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${category.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium">{category.name}</span>
          </div>

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
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Votes mobile */}
          <div className="flex sm:hidden">
            <VoteButtons score={score} userVote={userVote} onVote={handleVote} orientation="horizontal" />
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
        <CommentForm onSubmit={handleComment} />
      </div>

      {/* Liste des commentaires */}
      {comments.length > 0 ? (
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
