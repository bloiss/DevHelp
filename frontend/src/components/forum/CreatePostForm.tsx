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

const schema = z.object({
  title: z
    .string()
    .min(10, 'Le titre doit faire au moins 10 caractères')
    .max(150, 'Le titre ne peut pas dépasser 150 caractères'),
  category: z.string().min(1, 'Choisis une rubrique'),
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
    defaultValues: { title: '', category: '', content: '' },
  })

  const titleLength = watch('title').length

  async function onSubmit(_data: FormValues) {
    setApiError(null)
    try {
      // TODO: remplacer par postService.create() en semaine 2
      await new Promise((r) => setTimeout(r, 800)) // simule un appel API
      navigate({ to: '/forum' })
    } catch {
      setApiError('Une erreur est survenue. Réessaie dans un moment.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>

      {/* Erreur API */}
      {apiError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      {/* Titre */}
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

      {/* Catégorie */}
      <FieldWrapper label="Rubrique" htmlFor="category" error={errors.category?.message}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategorySelect
              value={field.value}
              onChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />
      </FieldWrapper>

      {/* Contenu */}
      <FieldWrapper label="Contenu" htmlFor="content" error={errors.content?.message}>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <PostEditor onChange={field.onChange} error={errors.content?.message} />
          )}
        />
      </FieldWrapper>

      {/* Actions */}
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
