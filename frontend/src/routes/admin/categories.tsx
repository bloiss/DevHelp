import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Pencil, Plus, ShieldAlert, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { categoryService } from '@/services/category.service'
import { toast } from '@/stores/toastStore'
import type { Category } from '@/types/post'

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
})

const PILLAR_OPTIONS = [
  { value: '', label: 'Aucun' },
  { value: 'dev', label: 'Dev' },
  { value: 'ai', label: 'IA' },
]

interface FormState {
  name: string
  description: string
  pillar: string
}

const EMPTY_FORM: FormState = { name: '', description: '', pillar: '' }

function CategoriesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
  })

  const createMutation = useMutation({
    mutationFn: () => categoryService.create({
      name: form.name,
      description: form.description || undefined,
      pillar: form.pillar || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie créée !', { description: form.name })
      setForm(EMPTY_FORM)
      setShowCreate(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Impossible de créer la catégorie.'
      toast.error('Erreur', { description: msg })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (id: string) => categoryService.update(id, {
      name: form.name,
      description: form.description || undefined,
      pillar: form.pillar || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie modifiée !')
      setEditingId(null)
      setForm(EMPTY_FORM)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Impossible de modifier la catégorie.'
      toast.error('Erreur', { description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie supprimée.')
      setDeleteConfirm(null)
    },
    onError: () => toast.error('Erreur', { description: 'Impossible de supprimer la catégorie.' }),
  })

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    )
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setForm({ name: cat.name, description: cat.description ?? '', pillar: cat.pillar ?? '' })
    setShowCreate(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function CategoryForm({ onSubmit, isPending }: { onSubmit: () => void; isPending: boolean }) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nom *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ex: JavaScript"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pilier</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.pillar}
              onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value }))}
              disabled={isPending}
            >
              {PILLAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description courte de la catégorie"
            disabled={isPending}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={editingId ? cancelEdit : () => setShowCreate(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={isPending || !form.name.trim()}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {editingId ? 'Sauvegarder' : 'Créer'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Tag className="h-5 w-5 text-blue-500" />
        <h1 className="text-xl font-bold tracking-tight">Catégories</h1>
      </div>

      {/* Formulaire de création */}
      {!showCreate && !editingId && (
        <Button size="sm" className="mb-6" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nouvelle catégorie
        </Button>
      )}

      {showCreate && !editingId && (
        <div className="mb-6">
          <CategoryForm onSubmit={() => createMutation.mutate()} isPending={createMutation.isPending} />
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aucune catégorie. Crée-en une !
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <CategoryForm
                  onSubmit={() => updateMutation.mutate(cat.id)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{cat.name}</span>
                      {cat.pillar && (
                        <Badge variant="secondary" className="text-xs">{cat.pillar}</Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {deleteConfirm === cat.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-destructive">Confirmer ?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(cat.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Oui'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                          Non
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
