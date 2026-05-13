import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { toast }    from '@/stores/toastStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from './FieldWrapper'
import { fadeInUp, stagger } from '@/lib/animations'

const schema = z
  .object({
    email: z.string().email('Email invalide'),
    username: z
      .string()
      .min(3, 'Minimum 3 caractères')
      .max(30, 'Maximum 30 caractères')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Uniquement lettres, chiffres, _ et -'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormValues) {
    setApiError(null)
    try {
      const res = await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        captcha_token: 'bypass-dev',
      })
      toast.success(`Compte créé ! Bienvenue, @${res.user.username}`)
      navigate({ to: '/forum' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (msg?.includes('email')) {
        setApiError('Cet email est déjà utilisé.')
        toast.error('Email déjà utilisé', { description: 'Essaie avec une autre adresse.' })
      } else if (msg?.includes('username')) {
        setApiError("Ce nom d'utilisateur est déjà pris.")
        toast.error("Nom d'utilisateur pris", { description: 'Choisis un autre identifiant.' })
      } else {
        setApiError("Une erreur est survenue. Réessaie dans un moment.")
        toast.error('Erreur', { description: "Une erreur est survenue. Réessaie dans un moment." })
      }
    }
  }

  return (
    <motion.form
      variants={stagger}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      {apiError && (
        <motion.div
          variants={fadeInUp}
          className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
        >
          {apiError}
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <FieldWrapper label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email" type="email" placeholder="vous@exemple.com"
            autoComplete="email" aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <FieldWrapper label="Nom d'utilisateur" htmlFor="username" error={errors.username?.message}>
          <Input
            id="username" type="text" placeholder="dev_42"
            autoComplete="username" aria-invalid={!!errors.username}
            {...register('username')}
          />
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <FieldWrapper label="Mot de passe" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <FieldWrapper
          label="Confirmer le mot de passe"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>
      </motion.div>

      <motion.p variants={fadeInUp} className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link to="/auth/login" className="text-foreground font-medium hover:underline underline-offset-4 transition-all">
          Se connecter
        </Link>
      </motion.p>
    </motion.form>
  )
}
