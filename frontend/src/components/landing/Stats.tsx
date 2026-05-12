import { Users, MessageSquare, LayoutGrid, CheckCircle2 } from 'lucide-react'

const STATS = [
  { icon: Users,          value: '1 200+',  label: 'Membres actifs'  },
  { icon: MessageSquare,  value: '4 800+',  label: 'Discussions'     },
  { icon: LayoutGrid,     value: '10',      label: 'Rubriques'       },
  { icon: CheckCircle2,   value: '98 %',    label: 'Questions résolues' },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
