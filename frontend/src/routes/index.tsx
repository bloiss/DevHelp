import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Features } from '@/components/landing/Features'
import { CategoriesPreview } from '@/components/landing/CategoriesPreview'
import { CallToAction } from '@/components/landing/CallToAction'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <Features />
      <CategoriesPreview />
      <CallToAction />
    </div>
  )
}
