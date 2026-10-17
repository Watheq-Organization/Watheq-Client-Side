import React, { useState, useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroOrbitalSection } from './HeroOrbitalSection';
import { OverviewTabletSection } from './OverviewTabletSection';
import { BentoGridSection } from './BentoGridSection';
import { TargetAudienceSection } from './TargetAudienceSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ComparisonSection } from './ComparisonSection';
import { PricingSection } from './PricingSection';
import { CustomPlanBuilderSection } from './CustomPlanBuilderSection';
import { FaqSection } from './FaqSection';
import { CtaBannerSection } from './CtaBannerSection';
import { LandingFooter } from './LandingFooter';

export const LandingScreen: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#070D1D] text-[#0F172A] dark:text-slate-100 font-cairo selection:bg-[#00D685]/30 selection:text-[#0B132B] dark:selection:text-[#00D685] transition-colors duration-200"
    >
      {/* Section 1: Sticky Glassmorphic Navbar */}
      <LandingNavbar theme={theme} onToggleTheme={toggleTheme} />

      <main>
        {/* Section 2: Interactive Hero Section with Orbital Feature Wheel (#top) */}
        <HeroOrbitalSection />

        {/* Section 3: Features Overview & Live Tablet Mockup (تعرّف على وثّق) */}
        <OverviewTabletSection />

        {/* Section 4: Detailed Features Bento Grid (#features) */}
        <BentoGridSection />

        {/* Section 5: Target Audience (لمين وثّق؟) */}
        <TargetAudienceSection />

        {/* Section 6: How It Works (#how-it-works) */}
        <HowItWorksSection />

        {/* Section 7: Comparison Matrix (#comparison) */}
        <ComparisonSection />

        {/* Section 8: Pricing Plans (#pricing) */}
        <PricingSection />

        {/* Section 9: Interactive Custom Plan Builder (ركّب الخطة على قدّ محلك) */}
        <CustomPlanBuilderSection />

        {/* Section 10: FAQ Accordion (#faq) */}
        <FaqSection />

        {/* Section 11: Final Call-to-Action Banner */}
        <CtaBannerSection />
      </main>

      {/* Section 12: Footer */}
      <LandingFooter />
    </div>
  );
};
