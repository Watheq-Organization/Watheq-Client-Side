import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export const CtaBannerSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="download" className="py-20 relative overflow-hidden bg-white dark:bg-[#070D1D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Full-width Rounded Container (#0B132B) */}
        <div className="relative rounded-3xl bg-[#0B132B] text-white p-8 sm:p-12 lg:p-16 border border-white/10 shadow-2xl overflow-hidden text-center">
          
          {/* Subtle Security Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#00D685_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

          {/* Emerald Radial Gradient Glow with Pulsing Breathing Animation */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,214,133,0.3)_0%,transparent_70%)] pointer-events-none blur-3xl animate-pulse-glow"></div>

          {/* Subtle sweeping light shimmer */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D685]/15 border border-[#00D685]/40 text-[#00D685] text-xs sm:text-sm font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>انضم لمئات التجار الذين يحمون أموالهم يومياً</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.25] font-cairo">
              خلّي أرقام محلك واضحة، وحقك دايماً محفوظ
            </h2>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              ابدأ اليوم مع وثّق وحوّل معاملاتك اليومية وديونك وتحويلاتك البنكية إلى سجل رقمي موثوق.
            </p>

            {/* Primary Action Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => navigate(PATHS.REGISTER)}
                className="px-10 py-4 text-base sm:text-lg font-black text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] active:bg-[#00B368] rounded-full shadow-[0_10px_35px_-5px_rgba(0,214,133,0.6)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>ابدأ مع وثّق مجاناً</span>
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1.5" />
              </button>
            </div>

            {/* Store Badges & PWA */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-4 border-t border-white/10 mt-8">
              
              {/* Google Play Styled Button */}
              <a
                href="#download-android"
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D685] transition-all flex items-center gap-3 text-right group"
              >
                <div className="w-7 h-7 flex items-center justify-center text-[#00D685]">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.993 1.993 0 0 1-.61-1.414V3.228c0-.53.21-1.04.609-1.414zm11.603 11.604l2.585 2.585-11.89 6.865 9.305-9.45zm2.585-2.836l-2.585 2.585L5.907 3.717l11.89 6.865zm1.536.886l2.124 1.226c.725.419.725 1.101 0 1.52l-2.124 1.226-2.176-2.176 2.176-1.796z"/>
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-400">تحميل للأندرويد</div>
                  <div className="text-xs font-bold text-white font-jakarta">Google Play</div>
                </div>
              </a>

              {/* App Store Styled Button */}
              <a
                href="#download-ios"
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D685] transition-all flex items-center gap-3 text-right group"
              >
                <div className="w-7 h-7 flex items-center justify-center text-[#00D685]">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.13.65-2.79 1.42-.58.67-1.1 1.74-1.01 2.78 1.08.08 2.18-.58 2.79-1.33z"/>
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-400">تحميل للآيفون</div>
                  <div className="text-xs font-bold text-white font-jakarta">App Store</div>
                </div>
              </a>

              {/* PWA Web App Styled Button */}
              <button
                onClick={() => navigate(PATHS.DASHBOARD)}
                className="px-5 py-2.5 rounded-2xl bg-[#00D685]/15 hover:bg-[#00D685]/25 border border-[#00D685]/40 transition-all flex items-center gap-3 text-right group cursor-pointer"
              >
                <Globe className="w-5 h-5 text-[#00D685]" />
                <div className="leading-tight">
                  <div className="text-[10px] text-[#00D685]">مباشرة بدون تحميل</div>
                  <div className="text-xs font-bold text-white">تجربة نسخة الويب (PWA)</div>
                </div>
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
