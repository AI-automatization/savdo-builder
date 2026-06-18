'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/lib/auth/context';

export function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => { landingTrack('landing_viewed'); }, []);

  useEffect(() => {
    if (user?.role === 'SELLER') router.replace('/dashboard');
  }, [user, router]);
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
