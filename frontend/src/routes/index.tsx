import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
    </div>
  )
}
