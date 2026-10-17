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
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const LandingScreen: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  // Activate luxury viewport scroll reveal observer
  useScrollReveal();

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

      <main className="space-y-4">
        {/* Section 2: Interactive Hero Section with Orbital Feature Wheel (#top) */}
        <div className="reveal-init">
          <HeroOrbitalSection />
        </div>

        {/* Section 3: Features Overview & Live Tablet Mockup (تعرّف على وثّق) */}
        <div className="reveal-init">
          <OverviewTabletSection />
        </div>

        {/* Section 4: Detailed Features Bento Grid (#features) */}
        <div className="reveal-init">
          <BentoGridSection />
        </div>

        {/* Section 5: Target Audience (لمين وثّق؟) */}
        <div className="reveal-init">
          <TargetAudienceSection />
        </div>

        {/* Section 6: How It Works (#how-it-works) */}
        <div className="reveal-init">
          <HowItWorksSection />
        </div>

        {/* Section 7: Comparison Matrix (#comparison) */}
        <div className="reveal-init">
          <ComparisonSection />
        </div>

        {/* Section 8: Pricing Plans (#pricing) */}
        <div className="reveal-init">
          <PricingSection />
        </div>

        {/* Section 9: Interactive Custom Plan Builder (ركّب الخطة على قدّ محلك) */}
        <div className="reveal-init">
          <CustomPlanBuilderSection />
        </div>

        {/* Section 10: FAQ Accordion (#faq) */}
        <div className="reveal-init">
          <FaqSection />
        </div>

        {/* Section 11: Final Call-to-Action Banner */}
        <div className="reveal-init">
          <CtaBannerSection />
        </div>
      </main>

      {/* Section 12: Footer */}
      <LandingFooter />
    </div>
  );
};

