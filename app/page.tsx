import { HeroSection } from '@/components/landing/HeroSection'
import { StatsBar } from '@/components/landing/StatsBar'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CtaSection } from '@/components/landing/CtaSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeatureGrid />
      <HowItWorks />
      <CtaSection />
    </>
  )
}
