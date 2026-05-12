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
      {/* Premier viewport : Hero + Stats, exactement 100vh moins la navbar */}
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
        <Hero />
        <Stats />
      </div>
      <Features />
      <CategoriesPreview />
      <CallToAction />
    </div>
  )
}
