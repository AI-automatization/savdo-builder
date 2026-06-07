'use client';

import { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { SocialProof } from './SocialProof';
import { ProblemSection } from './ProblemSection';
import { HowItWorks } from './HowItWorks';
import { Showcase } from './Showcase';
import { WhyUs } from './WhyUs';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { Faq } from './Faq';
import { FinalCta } from './FinalCta';
import { LandingFooter } from './LandingFooter';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function LandingPage() {
  useEffect(() => { landingTrack('landing_viewed'); }, []);
  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <LandingHeader />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSection />
        <HowItWorks />
        <Showcase />
        <WhyUs />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
