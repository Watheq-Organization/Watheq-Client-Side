import React, { useState } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  QrCode, 
  Wifi, 
  TrendingUp, 
  Building2
} from 'lucide-react';

export const OverviewTabletSection: React.FC = () => {
  const [alertDismissed, setAlertDismissed] = useState(false);

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-slate-50/70 dark:bg-[#0B132B]/50 border-y border-slate-200/80 dark:border-white/5">
      {/* Subtle radial emerald background glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 214, 133, 0.15), transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Right Column: Copy, Highlights, Bullets, and CTA */}
          <div className="lg:col-span-6 text-right space-y-6">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D685]"></span>
              <span>تعرّف على وثّق</span>
            </div>

            {/* Section Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white leading-[1.3] font-cairo">
              كل تفاصيل تجارتك... في صورة أوضح وموثقة
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              من الديون والمبيعات الفورية إلى حركة الكاشير والمخزون ومطابقة التحويلات البنكية وتأكيد الزبون اللحظي، يجمع وثّق تفاصيل تجارتك في مكان واحد لتتابع أرقامك بثقة وتتخذ قرارات أفضل حتى عند انقطاع الإنترنت.
            </p>

            {/* 2 Mini Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white dark:bg-[#111C35] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-[#00D685]/50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-[#E6F9F0] dark:bg-[#00D685]/10 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center font-bold mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white mb-1.5">
                  حسابات أوضح وتوثيق متبادل
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  تابع الديون والمدفوعات وأرسل إشعارات تأكيد فورية لزبائنك عبر تليجرام وواتساب.
                </p>
              </div>

              <div className="bg-white dark:bg-[#111C35] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-[#00D685]/50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white mb-1.5">
                  متابعة أدق بدون انقطاع
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  راقب المبيعات وحركة الكاشير والمخزون في مكان واحد مع دعم كامل للعمل أوفلاين.
                </p>
              </div>
            </div>

            {/* 3 Checkmark Bullets */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold">
                <div className="w-5 h-5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/20 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>متابعة معاملاتك المالية وتوثيقها بسهولة.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold">
                <div className="w-5 h-5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/20 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>رؤية أوضح لحركة المبيعات ورأس المال والأرباح.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold">
                <div className="w-5 h-5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/20 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>تنظيم أفضل لتفاصيل تجارتك بدون خوف من ضياع الدفاتر.</span>
              </div>
            </div>

            {/* CTA Link/Button */}
            <div className="pt-2">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] rounded-full shadow-[0_8px_20px_-4px_rgba(0,214,133,0.35)] transition-all hover:-translate-y-0.5 group cursor-pointer"
              >
                <span>اكتشف كيف يعمل وثّق</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1.5" />
              </a>
            </div>

          </div>

          {/* Left Column: Sleek Angled Dark Tablet Mockup (#0B132B) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Tablet Chassis */}
            <div className="w-full max-w-[540px] bg-[#0B132B] rounded-[28px] p-3 sm:p-4 border border-white/10 shadow-[0_20px_50px_-10px_rgba(11,19,43,0.6)] relative z-10 transition-transform duration-500 hover:scale-[1.01]">
              
              {/* Tablet Top Bezel: Camera & Sensors */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#00D685] animate-pulse"></span>
                  <span>متصل ومزامن (Cloud Sync)</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-slate-800 border border-white/20"></div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>98%</span>
                  <Wifi className="w-3 h-3 text-[#00D685]" />
                </div>
              </div>

              {/* Tablet Screen Content */}
              <div className="bg-[#111C35] rounded-2xl p-4 sm:p-5 mt-2 space-y-4 text-right">
                
                {/* Header inside Tablet */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00D685]/20 text-[#00D685] flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">سوبرماركت البركة — الفرع الرئيسي</div>
                      <div className="text-[10px] text-slate-400">لوحة المتابعة اللحظية</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#00D685] bg-[#00D685]/10 px-2.5 py-1 rounded-full border border-[#00D685]/20">
                    نشط الآن
                  </span>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#0B132B] p-3 rounded-xl border border-white/5 text-right">
                    <div className="text-[10px] text-slate-400 mb-1">الديون الموثقة</div>
                    <div className="text-base sm:text-lg font-black text-white font-mono">
                      142,850 <span className="text-[10px] font-cairo text-slate-400">₪</span>
                    </div>
                    <div className="text-[9px] text-[#00D685] font-semibold mt-1">✓ 100% موثقة</div>
                  </div>

                  <div className="bg-[#0B132B] p-3 rounded-xl border border-white/5 text-right">
                    <div className="text-[10px] text-slate-400 mb-1">مبيعات اليوم</div>
                    <div className="text-base sm:text-lg font-black text-[#00D685] font-mono">
                      8,420 <span className="text-[10px] font-cairo text-[#00D685]">₪</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">48 معاملة</div>
                  </div>

                  <div className="bg-[#0B132B] p-3 rounded-xl border border-white/5 text-right">
                    <div className="text-[10px] text-slate-400 mb-1">التحويلات البنكية</div>
                    <div className="text-base sm:text-lg font-black text-white font-mono">
                      19/20
                    </div>
                    <div className="text-[9px] text-amber-400 font-semibold mt-1">1 بحاجة لمراجعة</div>
                  </div>
                </div>

                {/* Mini Graph & Activity Line */}
                <div className="bg-[#0B132B] p-3.5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[11px] mb-2 font-bold text-slate-300">
                    <span>حركة التحصيلات والمبيعات الأسبوعية</span>
                    <span className="text-[#00D685] font-mono">+18.4% ↗</span>
                  </div>
                  {/* Visual SVG bar chart */}
                  <div className="flex items-end justify-between h-14 pt-2 gap-1.5 px-2">
                    {[40, 65, 50, 85, 70, 95, 80].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          style={{ height: `${h}%` }}
                          className={`w-full rounded-t-sm transition-all ${
                            i === 5 ? 'bg-[#00D685]' : 'bg-[#00D685]/30'
                          }`}
                        ></div>
                        <span className="text-[8px] text-slate-500 font-mono">
                          {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini Table Rows Preview */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">آخر العمليات المتزامنة:</div>
                  <div className="flex items-center justify-between text-xs bg-[#0B132B] p-2.5 rounded-lg border border-white/5">
                    <span className="text-white font-medium">سداد دين — متجر الأنوار</span>
                    <span className="text-[#00D685] font-mono font-bold">+650 ₪</span>
                    <span className="text-[10px] text-slate-400">قبل 4 د</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Floating Interactive Alert Card in Amber (Top-Right of Tablet) */}
            {!alertDismissed && (
              <div className="absolute -top-6 -right-2 sm:-right-8 z-20 w-[290px] sm:w-[320px] bg-amber-50 dark:bg-[#1E1B13] border-2 border-amber-400 dark:border-amber-500/60 rounded-2xl p-3.5 shadow-2xl transition-all animate-float-slow">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-xs font-black text-amber-900 dark:text-amber-300">
                      بحاجة لمراجعة ⚠️
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-snug">
                      تحويل بنكي (450 ₪) لا يقابله بيع مسجّل
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => setAlertDismissed(true)}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
                      >
                        ربط ببيع مسجل
                      </button>
                      <button
                        onClick={() => setAlertDismissed(true)}
                        className="px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                      >
                        تجاهل
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Customer Verification Card in Emerald (Bottom-Left of Tablet) */}
            <div className="absolute -bottom-8 -left-2 sm:-left-8 z-20 w-[290px] sm:w-[330px] bg-white dark:bg-[#0E1A16] border-2 border-[#00D685] rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,214,133,0.3)] text-right space-y-2 animate-float-delayed backdrop-blur-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00D685] text-[#0B132B] flex items-center justify-center font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#0F172A] dark:text-white">
                    توثيق تليجرام المباشر
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#00A86B] dark:text-[#00D685] bg-[#E6F9F0] dark:bg-[#00D685]/10 px-2 py-0.5 rounded-full border border-[#00D685]/30">
                  <QrCode className="w-3 h-3" />
                  <span>QR VERIFIED</span>
                </div>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                🟢 <span className="font-bold">تم تأكيد الدين من العميل عبر تليجرام:</span>
                <div className="text-[#00A86B] dark:text-[#00D685] font-black mt-0.5">
                  أحمد العبد — فاتورة بقيمة (45 ₪)
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                <span>معرّف المعاملة: #WTH-9942</span>
                <span>إقرار إلكتروني ملزم ✅</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
