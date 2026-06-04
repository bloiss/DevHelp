import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Inconnu'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Inconnu'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "à l'instant"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "à l'instant"
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  return formatDate(date)
}
