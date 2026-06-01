import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from '@/components/auth/FieldWrapper'
import { PostEditor } from './PostEditor'
import { CategorySelect } from './CategorySelect'
import { postService } from '@/services/post.service'
import { categoryService } from '@/services/category.service'
import { getCategoryBySlug } from '@/data/categories'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

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

interface CreatePostFormProps {
  defaultCategorySlug?: string
}

export function CreatePostForm({ defaultCategorySlug }: CreatePostFormProps) {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)
  const [categoryLocked, setCategoryLocked] = useState(!!defaultCategorySlug)

  // Needed to resolve slug → id for pre-selection
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.list,
    staleTime: 5 * 60 * 1000,
    enabled: !!defaultCategorySlug,
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', category_id: '', content: '' },
  })

  // Pre-select category from slug once categories are loaded
  useEffect(() => {
    if (defaultCategorySlug && categories.length > 0) {
      const cat = categories.find((c) => c.slug === defaultCategorySlug)
      if (cat) setValue('category_id', cat.id, { shouldValidate: false })
    }
  }, [defaultCategorySlug, categories, setValue])

  const titleLength = watch('title').length
  const categoryId = watch('category_id')
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedCategoryMeta = selectedCategory ? getCategoryBySlug(selectedCategory.slug) : null
  const showLockedCategory = categoryLocked && !!selectedCategory && !!selectedCategoryMeta
  const LockedIcon = selectedCategoryMeta?.icon

  async function onSubmit(data: FormValues) {
    setApiError(null)
    try {
      const post = await postService.create({
        title: data.title,
        category_id: data.category_id,
        content: data.content,
      })
      toast.success('Post publié !')
      navigate({ to: '/forum/$category/$postId', params: { category: post.category.slug, postId: post.id } })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } }; message?: string }
      const detail = axiosErr?.response?.data?.error ?? axiosErr?.message ?? 'inconnue'
      const status = axiosErr?.response?.status
      if (!status) {
        setApiError('Impossible de joindre le serveur — le backend est-il lancé sur le port 8080 ?')
      } else {
        setApiError(`Erreur ${status} : ${detail}`)
      }
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

      <FieldWrapper label="Rubrique" htmlFor="category_id" error={!showLockedCategory ? errors.category_id?.message : undefined}>
        {showLockedCategory ? (
          // Locked category display — pre-selected from the category page
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm',
            'border-primary/30 bg-primary/5',
          )}>
            <div className={cn('p-1.5 rounded-md shrink-0', selectedCategoryMeta!.color)}>
              {LockedIcon && <LockedIcon className="h-3.5 w-3.5" />}
            </div>
            <span className="flex-1 font-medium">{selectedCategory!.name}</span>
            <button
              type="button"
              onClick={() => setCategoryLocked(false)}
              title="Changer de rubrique"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
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
        )}
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
        <Button type="submit" disabled={isSubmitting} className="btn-shimmer">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Publier le post
        </Button>
      </div>
    </form>
  )
}
