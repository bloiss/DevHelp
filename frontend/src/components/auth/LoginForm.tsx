import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from './FieldWrapper'
import { fadeInUp, stagger } from '@/lib/animations'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const { login } = useAuth()
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
      await login(data)
      navigate({ to: '/forum' })
    } catch {
      setApiError('Email ou mot de passe incorrect.')
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
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <FieldWrapper label="Mot de passe" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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
          <Link
            to="/auth/forgot-password"
            className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </FieldWrapper>
      </motion.div>

      <motion.div variants={fadeInUp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </motion.div>

      <motion.p variants={fadeInUp} className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link to="/auth/register" className="text-foreground font-medium hover:underline underline-offset-4 transition-all">
          S'inscrire
        </Link>
      </motion.p>
    </motion.form>
  )
}
