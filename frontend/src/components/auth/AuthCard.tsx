import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Code2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  oauth?: ReactNode
  className?: string
}

// Layout partagé pour les pages login et register
export function AuthCard({ title, description, children, oauth, className }: AuthCardProps) {
  return (
    <div className={cn('w-full max-w-sm mx-auto flex flex-col gap-6', className)}>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-xl justify-center">
        <Code2 className="h-6 w-6 text-primary" />
        <span>DevHelp</span>
      </Link>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Formulaire */}
        {children}

        {/* Séparateur OAuth — affiché uniquement si fourni */}
        {oauth && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou continuer avec</span>
              <Separator className="flex-1" />
            </div>
            {oauth}
          </>
        )}
      </div>
    </div>
  )
}
