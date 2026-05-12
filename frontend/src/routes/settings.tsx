import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Camera, ChevronRight, Lock } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'

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

function SettingsPage() {
  const { user } = useAuthStore()

  const [username, setUsername] = useState(user?.username ?? '')
  const [notifComment, setNotifComment] = useState(true)
  const [notifLike, setNotifLike] = useState(true)
  const [notifMessage, setNotifMessage] = useState(true)
  const [notifPush, setNotifPush] = useState(false)

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

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  user={user ?? { username: '?', avatar_url: undefined }}
                  size="lg"
                  className="h-16 w-16 text-xl"
                />
                <button
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                  title="Changer l'avatar"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium">Photo de profil</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG ou PNG, max 2 Mo</p>
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
              />
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
              <Button size="sm">Sauvegarder</Button>
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
                description: 'Quand quelqu\'un commente un de tes posts',
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
