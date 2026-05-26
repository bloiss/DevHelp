import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from '@/components/auth/FieldWrapper'
import { PostEditor } from './PostEditor'
import { CategorySelect } from './CategorySelect'
import { postService } from '@/services/post.service'
import { toast } from '@/stores/toastStore'

const schema = z.object({
  title: z
    .string()
    .min(10, 'Le titre doit faire au moins 10 caractères')
    .max(150, 'Le titre ne peut pas dépasser 150 caractères'),
  category_id: z.string().min(1, 'Choisis une rubrique'),
  content: z
    .string()
    .min(30, 'Le contenu doit faire au moins 30 caractères')
    .refine((v) => v !== '<p></p>' && v.trim() !== '', 'Le contenu est requis'),
})

type FormValues = z.infer<typeof schema>

export function CreatePostForm() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', category_id: '', content: '' },
  })

  const titleLength = watch('title').length

  async function onSubmit(data: FormValues) {
    setApiError(null)
    try {
      const post = await postService.create({
        title: data.title,
        category_id: data.category_id,
        content: data.content,
      })
      toast.success('Post publié !', { description: 'Ton post est en cours de modération.' })
      navigate({ to: '/forum/$category/$postId', params: { category: post.category.slug, postId: post.id } })
    } catch {
      setApiError('Une erreur est survenue. Réessaie dans un moment.')
      toast.error('Erreur', { description: 'Impossible de publier le post.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>

      {apiError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <FieldWrapper label="Titre" htmlFor="title" error={errors.title?.message}>
        <div className="relative">
          <Input
            id="title"
            placeholder="Décris ton problème ou sujet en une phrase claire…"
            maxLength={150}
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
            {titleLength}/150
          </span>
        </div>
      </FieldWrapper>

      <FieldWrapper label="Rubrique" htmlFor="category_id" error={errors.category_id?.message}>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <CategorySelect
              value={field.value}
              onChange={field.onChange}
              error={errors.category_id?.message}
            />
          )}
        />
      </FieldWrapper>

      <FieldWrapper label="Contenu" htmlFor="content" error={errors.content?.message}>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <PostEditor onChange={field.onChange} error={errors.content?.message} />
          )}
        />
      </FieldWrapper>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/forum' })}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Publier le post
        </Button>
      </div>
    </form>
  )
}
