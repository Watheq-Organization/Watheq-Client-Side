import React from 'react';
import { WatheqBrandLogo } from './WatheqBrandLogo';
import { Lock, WifiOff } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 dark:bg-[#060B16] text-white border-t border-slate-800 dark:border-white/10 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800 dark:border-white/10">
          
          {/* Right Column: Logo & Description (RTL start) */}
          <div className="md:col-span-5 text-right space-y-4">
            <WatheqBrandLogo size="md" lightText={true} />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-normal">
              منصة رقمية لإدارة وتوثيق مالية المحلات: ديون، مبيعات، مخزون، تحويلات بنكية، موظفين وفروع. صُممت خصيصاً للتجار لضمان حقوقهم وحقوق زبائنهم.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
                <Lock className="w-3 h-3 text-[#00D685]" />
                <span>تشفير مصرفي 256-bit</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
                <WifiOff className="w-3 h-3 text-[#00D685]" />
                <span>معمارية أوفلاين حقيقية</span>
              </span>
            </div>
          </div>

          {/* Center Column: Quick Navigation Links */}
          <div className="md:col-span-4 text-right space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-[#00D685] transition-colors">
                  المزايا والخصائص
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#00D685] transition-colors">
                  كيف يعمل وثّق؟
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-[#00D685] transition-colors">
                  المقارنة والبدائل
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#00D685] transition-colors">
                  الخطط والأسعار
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#00D685] transition-colors">
                  الأسئلة الشائعة
                </a>
              </li>
            </ul>
          </div>

          {/* Left Column: Legal & Support Links */}
          <div className="md:col-span-3 text-right space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              المساعدة والأمان
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="/help" className="hover:text-[#00D685] transition-colors">
                  مركز المساعدة والدعم
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-[#00D685] transition-colors">
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-[#00D685] transition-colors">
                  شروط الاستخدام والخدمة
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-[#00D685] transition-colors">
                  تواصل مع فريق الدعم الفني
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Mission Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 text-center sm:text-right">
          <div>
            © 2026 Watheq وثّق — جميع الحقوق محفوظة. نوثّق المعاملة، نوضح الحساب، ونبني الثقة الرقمية.
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>صُنع بشغف لتمكين التجار وأصحاب المحلات</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
