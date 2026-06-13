import { HeroSection } from '@/components/landing/HeroSection'
import { StatsBar } from '@/components/landing/StatsBar'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/shared/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white selection:bg-primary-100 selection:text-primary-900">
      <HeroSection />
      <StatsBar />
      <FeatureGrid />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </div>
  )
}
