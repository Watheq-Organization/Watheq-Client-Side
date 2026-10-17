import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpenCheck, 
  Landmark, 
  Mic, 
  Receipt, 
  Boxes, 
  Users,
  CheckCircle2,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { PATHS } from '../../routes/paths';

export const HeroOrbitalSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [isAutoCycle, setIsAutoCycle] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play a subtle tech chime when switching nodes if sound is enabled
  const playTechClick = () => {
    if (!isSoundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const features = [
    {
      id: 'debts',
      title: 'إدارة الديون والتوثيق',
      shortTitle: 'الديون والتوثيق',
      icon: BookOpenCheck,
      badge: 'توثيق ثنائي فوري',
      description: 'سجّل معاملات الدين والدفعات بالصوت أو النص، وأرسل رابط توثيق لحظي عبر تليجرام وواتساب مع زر إقرار معتمد.',
      previewHighlight: '✓ تم تأكيد المعاملة عبر تليجرام — أحمد العبد (45 ₪)',
      previewStatus: 'مُقرّ وموثق ✅',
      statusClass: 'bg-[#E6F9F0] text-[#00A86B] border-[#00D685]/30 dark:bg-[#00D685]/10 dark:text-[#00D685]',
      meta: 'كشف حساب PDF مشفر • QR Code مباشر',
    },
    {
      id: 'reconciliation',
      title: 'مطابقة التحويلات البنكية',
      shortTitle: 'التحويلات البنكية',
      icon: Landmark,
      badge: 'مطابقة آلية ذكية',
      description: 'قارن إشعارات الحسابات البنكية (بنك فلسطين، الإسلامي، القدس) بالمبيعات المسجلة لكشف أي تحويل وهمي أو مفقود.',
      previewHighlight: '✓ مطابقة فورية: تحويل بنكي (450 ₪) مطابق للبيع مسجّل #1042',
      previewStatus: 'مطابق ومقيد ✓',
      statusClass: 'bg-[#E6F9F0] text-[#00A86B] border-[#00D685]/30 dark:bg-[#00D685]/10 dark:text-[#00D685]',
      meta: 'كشف فوري للحوالات العالقة والمعلقة',
    },
    {
      id: 'voice',
      title: 'الإدخال الصوتي بالذكاء الاصطناعي',
      shortTitle: 'الإدخال الصوتي',
      icon: Mic,
      badge: 'لهجة فلسطينية وعربية',
      description: 'تحدث بالعامية: "سجل دين على أبو خالد كرتونة زيت 120 شيكل" ليحولها الذكاء الاصطناعي إلى قيد مالي دقيق في ثانية.',
      previewHighlight: '🎙️ "سجل دين على أبو خالد 120 ₪" ➔ تم القيد والتوثيق',
      previewStatus: 'معالجة فورية ⚡',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400',
      meta: 'دقة لغوية 100% • بدون الحاجة للكتابة',
    },
    {
      id: 'pos',
      title: 'المبيعات والكاشير أوفلاين',
      shortTitle: 'المبيعات والكاشير',
      icon: Receipt,
      badge: 'يعمل بدون إنترنت (Offline-First)',
      description: 'كاشير سريع متوافق مع قارئ الباركود والطابعات الحرارية، يعمل بانسيابية تامة حتى لو انقطعت الكهرباء والإنترنت.',
      previewHighlight: '⚡ معاملة كاشير #8843 تمت بدون اتصال وحفظت محلياً بنجاح',
      previewStatus: 'مزامنة معلقة (أوفلاين) 📶',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400',
      meta: 'قاعدة بيانات محلية مشفرة SQLite3',
    },
    {
      id: 'inventory',
      title: 'إدارة المخزون الذكية',
      shortTitle: 'إدارة المخزون',
      icon: Boxes,
      badge: 'فصل الأرباح عن رأس المال',
      description: 'تتبع حركة الأصناف، الوارد والمنصرف، وتلقَّ تنبيهات تلقائية عندما توشك بضائعك على النفاد مع حساب دقيق للأرباح.',
      previewHighlight: '📦 تنبيه نقص: صنف حليب المراعي متبقي 4 علب فقط بالمستودع',
      previewStatus: 'تنبيه إعادة طلب ⚠️',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400',
      meta: 'جرد فوري • حساب متوسط التكلفة',
    },
    {
      id: 'branches',
      title: 'الموظفين والفروع المتعددة',
      shortTitle: 'الموظفين والفروع',
      icon: Users,
      badge: 'صلاحيات مركزية وموحدة',
      description: 'أدر طاقم عملك، حدد صلاحيات الكاشير والمحاسب، وشاهد تقارير مبيعات الفروع الموحدة من شاشة واحدة.',
      previewHighlight: '🏬 ملخص موحد: فرع المركز + فرع الشمال في تقرير مالي لحظي',
      previewStatus: '3 فروع نشطة 🟢',
      statusClass: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400',
      meta: 'صلاحيات محكمة • مراقبة إغلاق الدرج',
    },
  ];

  // Auto-cycle through features every 4 seconds
  useEffect(() => {
    if (!isAutoCycle) return;
    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => {
        const next = (prev + 1) % features.length;
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoCycle, features.length]);

  const selectFeature = (index: number) => {
    setActiveFeatureIndex(index);
    playTechClick();
  };

  const activeFeature = features[activeFeatureIndex];

  // Orbital positions for 6 nodes around the circle (radius = 145px)
  const orbitRadius = 140;

  return (
    <section id="top" className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
      {/* Background radial emerald glow */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(0,214,133,0.12)_0%,transparent_70%)] pointer-events-none blur-2xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Right Column: Value Proposition & CTAs (RTL Desktop) */}
          <div className="lg:col-span-7 text-right space-y-6">
            
            {/* Eyebrow Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#00D685] animate-ping"></span>
              <Sparkles className="w-3.5 h-3.5" />
              <span>المنظومة الرقمية للتوثيق المالي وإدارة معاملات المحلات</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] dark:text-white leading-[1.25] tracking-tight font-cairo">
              محلك بحكي أرقام...{' '}
              <span className="text-[#00D685] relative inline-block">
                وثّق
                <span className="absolute bottom-1 right-0 w-full h-2 bg-[#00D685]/20 -z-10 rounded-full blur-[1px]"></span>
              </span>{' '}
              بخليك تفهمها وتوثقها.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
              الديون، المبيعات، الكاشير، المخزون، التحويلات البنكية، والتوثيق الفوري مع الزبائن — كلها بمكان واحد ويعمل بدون إنترنت{' '}
              <span className="text-[#00A86B] dark:text-[#00D685] font-bold">
                (Offline-First)
              </span>
              ، عشان تشوف وضع محلك بوضوح وتحفظ حقك وحق زبونك.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate(PATHS.REGISTER)}
                className="px-8 py-4 text-base font-extrabold text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] active:bg-[#00B368] rounded-full shadow-[0_10px_30px_-5px_rgba(0,214,133,0.45)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>ابدأ مع وثّق</span>
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1.5" />
              </button>

              <a
                href="#download"
                className="px-7 py-4 text-base font-bold text-slate-700 dark:text-white bg-white dark:bg-[#111C35] hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-white/10 rounded-full transition-all hover:border-[#00D685] flex items-center justify-center gap-2.5 shadow-sm"
              >
                <Download className="w-5 h-5 text-[#00D685]" />
                <span>حمّل التطبيق</span>
              </a>
            </div>

            {/* Trust Indicators Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-white/10 max-w-xl">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#00D685] shrink-0" />
                <span>بدون أي رسوم خفية</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                <WifiOff className="w-4 h-4 text-[#00D685] shrink-0" />
                <span>يعمل 100% أوفلاين</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#00D685] shrink-0" />
                <span>توثيق فوري ملزم</span>
              </div>
            </div>

          </div>

          {/* Left Column: Interactive Orbital Feature Wheel + Live Preview Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* The Orbital Wheel Container */}
            <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
              
              {/* Outer Decorative Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#00D685]/30 dark:border-[#00D685]/20 animate-[spin_60s_linear_infinite]"></div>
              
              {/* Middle Primary Orbital Track */}
              <div className="absolute w-[280px] h-[280px] rounded-full border border-slate-200 dark:border-white/10 shadow-[inset_0_0_30px_rgba(0,214,133,0.05)]"></div>

              {/* Central Glowing Shield Node */}
              <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0B132B] to-[#111C35] border-2 border-[#00D685] shadow-[0_0_30px_rgba(0,214,133,0.4)] flex flex-col items-center justify-center p-3 text-center transition-transform hover:scale-105">
                <div className="w-10 h-10 rounded-xl bg-[#00D685]/20 flex items-center justify-center text-[#00D685] mb-1">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="text-white text-xs font-black font-cairo">وثّـق</span>
                <span className="text-[9px] text-[#00D685] font-jakarta">Watheq</span>

                {/* Central Pulse Ring */}
                <div className="absolute -inset-1 rounded-2xl border border-[#00D685]/40 animate-ping pointer-events-none opacity-40"></div>
              </div>

              {/* 6 Clickable Orbital Nodes */}
              {features.map((feat, idx) => {
                // Angle in radians (6 items = 60 degrees each)
                const angle = (idx * 60 - 90) * (Math.PI / 180);
                const x = Math.round(orbitRadius * Math.cos(angle));
                const y = Math.round(orbitRadius * Math.sin(angle));
                const isSelected = idx === activeFeatureIndex;
                const IconComponent = feat.icon;

                return (
                  <button
                    key={feat.id}
                    onClick={() => selectFeature(idx)}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    className={`absolute z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer ${
                      isSelected
                        ? 'bg-[#00D685] text-[#0B132B] shadow-[0_0_25px_rgba(0,214,133,0.8)] scale-110 ring-4 ring-[#00D685]/30'
                        : 'bg-white dark:bg-[#111C35] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:border-[#00D685] hover:text-[#00D685] hover:scale-105 shadow-md'
                    }`}
                    title={feat.title}
                    aria-label={feat.title}
                  >
                    <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isSelected ? 'scale-110 stroke-[2.2]' : ''}`} />
                    
                    {/* Active Indicator Dot */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#0B132B] border-2 border-[#00D685]"></span>
                    )}

                    {/* Tooltip on hover */}
                    <span className="absolute -bottom-7 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#0B132B] text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-30">
                      {feat.shortTitle}
                    </span>
                  </button>
                );
              })}

            </div>

            {/* Playback Controls & Node Steppers */}
            <div className="flex items-center gap-3 mt-4 mb-4">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={() => setIsAutoCycle(!isAutoCycle)}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#111C35] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#00D685] flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isAutoCycle ? 'إيقاف التبديل التلقائي' : 'تشغيل التبديل التلقائي'}
              >
                {isAutoCycle ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#00D685]" />
                    <span>إيقاف العرض التلقائي</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#00D685]" />
                    <span>تشغيل العرض التلقائي</span>
                  </>
                )}
              </button>

              {/* Sound Feedback Toggle */}
              <button
                onClick={() => {
                  const next = !isSoundEnabled;
                  setIsSoundEnabled(next);
                  if (next) playTechClick();
                }}
                className={`p-2 rounded-full border transition-colors ${
                  isSoundEnabled
                    ? 'bg-[#E6F9F0] text-[#00A86B] border-[#00D685]/40 dark:bg-[#00D685]/10 dark:text-[#00D685]'
                    : 'bg-slate-100 dark:bg-[#111C35] text-slate-400 border-slate-200 dark:border-white/10'
                }`}
                title={isSoundEnabled ? 'صوت التفاعل مفعّل' : 'تفعيل صوت التفاعل'}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => selectFeature(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeFeatureIndex
                        ? 'w-6 bg-[#00D685]'
                        : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                    aria-label={`الخاصية ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Synchronized Floating Feature Preview Card directly below the wheel */}
            <div className="w-full max-w-md bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] transition-all text-right space-y-3 relative overflow-hidden">
              {/* Emerald top edge line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#00D685] via-[#00D685]/60 to-transparent"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F9F0] dark:bg-[#00D685]/10 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center font-bold">
                    <activeFeature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                      {activeFeature.title}
                    </h3>
                    <span className="text-[11px] text-[#00A86B] dark:text-[#00D685] font-semibold">
                      {activeFeature.badge}
                    </span>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${activeFeature.statusClass}`}>
                  {activeFeature.previewStatus}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {activeFeature.description}
              </p>

              {/* Live Mini Preview Bar */}
              <div className="bg-slate-50 dark:bg-[#0B132B] rounded-xl p-3 border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {activeFeature.previewHighlight}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 mr-2">
                  {activeFeature.meta}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
