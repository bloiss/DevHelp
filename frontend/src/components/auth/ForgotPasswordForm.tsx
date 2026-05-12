import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from './FieldWrapper'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setApiError(null)
    try {
      await authService.forgotPassword(data.email)
      setSubmitted(true)
    } catch {
      setApiError('Une erreur est survenue. Réessaie dans un moment.')
    }
  }

  // État succès — toujours le même message pour ne pas révéler si l'email existe
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium">Email envoyé !</p>
          <p className="text-sm text-muted-foreground mt-1">
            Si un compte existe avec cette adresse, tu recevras un lien de réinitialisation dans quelques minutes.
          </p>
        </div>
        <Link to="/auth/login">
          <Button variant="outline" size="sm" className="gap-2 mt-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

      {apiError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <FieldWrapper label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
      </FieldWrapper>

      <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Envoyer le lien
      </Button>

      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à la connexion
      </Link>
    </form>
  )
}
