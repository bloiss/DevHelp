import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Camera, ChevronRight, Loader2, Lock, ImagePlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/user.service'
import { toast } from '@/stores/toastStore'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar_url)
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(user?.banner_url)
  const [avatarFile, setAvatarFile] = useState<string | undefined>()
  const [bannerFile, setBannerFile] = useState<string | undefined>()

  const [notifComment, setNotifComment] = useState(true)
  const [notifLike, setNotifLike] = useState(true)
  const [notifMessage, setNotifMessage] = useState(true)
  const [notifPush, setNotifPush] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde', { description: 'Max 2 Mo.' })
      return
    }
    const dataUrl = await fileToDataURL(file)
    setAvatarPreview(dataUrl)
    setAvatarFile(dataUrl)
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde', { description: 'Max 5 Mo.' })
      return
    }
    const dataUrl = await fileToDataURL(file)
    setBannerPreview(dataUrl)
    setBannerFile(dataUrl)
  }

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: () => userService.updateMe({
      username: username !== user?.username ? username : undefined,
      bio: bio !== (user?.bio ?? '') ? bio : undefined,
      avatar_url: avatarFile,
      banner_url: bannerFile,
    }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      setAvatarFile(undefined)
      setBannerFile(undefined)
      // Invalide le cache du profil pour que la page profil se rafraîchisse
      queryClient.invalidateQueries({ queryKey: ['profile', updatedUser.username] })
      toast.success('Profil mis à jour !')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Impossible de mettre à jour le profil.'
      toast.error('Erreur', { description: msg })
    },
  })

  const hasChanges =
    username !== user?.username ||
    bio !== (user?.bio ?? '') ||
    !!avatarFile ||
    !!bannerFile

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Paramètres</h1>

      <div className="flex flex-col gap-8">

        {/* Profil */}
        <Section
          title="Profil"
          description="Ces informations sont visibles par les autres membres."
        >
          <div className="flex flex-col gap-5">

            {/* Bannière */}
            <div>
              <Label className="text-sm mb-2 block">Bannière</Label>
              <div
                className="relative h-32 rounded-xl overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-muted cursor-pointer group"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerPreview && (
                  <img
                    src={bannerPreview}
                    alt="Bannière"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center gap-1.5 text-white">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs font-medium">Changer la bannière</span>
                  </div>
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleBannerChange}
              />
              <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG ou GIF — max 5 Mo</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <Avatar
                    user={user ?? { username: '?', avatar_url: undefined }}
                    size="lg"
                    className="h-16 w-16 text-xl"
                  />
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                  title="Changer l'avatar"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Photo de profil</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG ou PNG — max 2 Mo</p>
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ton_pseudo"
                disabled={isPending}
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Quelques mots sur toi…"
                disabled={isPending}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
            </div>

            {/* Email — lecture seule */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                value={user?.email ?? ''}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié pour l'instant.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => saveProfile()}
                disabled={isPending || !username.trim() || !hasChanges}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Sauvegarder
              </Button>
            </div>
          </div>
        </Section>

        <Separator />

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Choisis quand tu souhaites être notifié."
        >
          <div className="flex flex-col gap-4">
            {[
              {
                id: 'notif-comment',
                label: 'Commentaires',
                description: "Quand quelqu'un commente un de tes posts",
                value: notifComment,
                onChange: setNotifComment,
              },
              {
                id: 'notif-like',
                label: 'Votes',
                description: 'Quand quelqu\'un vote pour un de tes posts',
                value: notifLike,
                onChange: setNotifLike,
              },
              {
                id: 'notif-message',
                label: 'Messages privés',
                description: 'Quand tu reçois un nouveau message',
                value: notifMessage,
                onChange: setNotifMessage,
              },
              {
                id: 'notif-push',
                label: 'Notifications push',
                description: 'Recevoir des notifications dans le navigateur',
                value: notifPush,
                onChange: setNotifPush,
              },
            ].map(({ id, label, description, value, onChange }) => (
              <div key={id} className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <Switch
                  id={id}
                  checked={value}
                  onCheckedChange={onChange}
                />
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Sécurité */}
        <Section title="Sécurité">
          <Link
            to="/auth/reset-password"
            search={{ token: '' }}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Changer le mot de passe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Modifie ton mot de passe actuel
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </Section>

      </div>
    </div>
  )
}
