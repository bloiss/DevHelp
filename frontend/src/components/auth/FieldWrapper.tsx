import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldWrapperProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
  className?: string
}

// Regroupe label + input + message d'erreur — évite la répétition dans chaque formulaire
export function FieldWrapper({ label, htmlFor, error, children, className }: FieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
