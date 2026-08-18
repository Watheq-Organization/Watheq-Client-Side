import React, { useState } from 'react';
import { 
  Check, 
  X as CloseIcon, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  Building2, 
  Headphones
} from 'lucide-react';
import { ScreenType } from './Header';

interface SubscriptionsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onNavigate }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState<boolean>(false);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<{
    name: string;
    price: string;
    period: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCheckout = (name: string, price: string, period: string) => {
    setActiveCheckoutPlan({ name, price, period });
    setIsSubscribeModalOpen(true);
  };

  const handleConfirmSubscription = () => {
    setIsSubscribeModalOpen(false);
    showToast(`تهانينا! تم تفعيل خطة "${activeCheckoutPlan?.name}" بنجاح.`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria tracking-tight">
          اختر الخطة المناسبة لنمو أعمالك
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          خطط مرنة مصممة لتلبية احتياجات التجار والمؤسسات باختلاف أحجامها.
        </p>
      </div>

      {/* PRICING CARDS (3 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        
        {/* CARD 1: BASIC / مجانية */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-center justify-between">
              <span className="bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold px-3 py-1 rounded-full font-alexandria">
                الأساسية
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-slate-900 font-alexandria">
                مجانية
              </div>
              <p className="text-xs text-slate-500 font-medium">
                للتجار المبتدئين في تنظيم ديونهم.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>حتى 10 عملاء</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>توثيق ديون أساسي</span>
              </li>

              <li className="flex items-center gap-2.5 text-slate-400">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <CloseIcon className="w-3.5 h-3.5" />
                </div>
                <span className="line-through decoration-slate-300">تنبيهات واتساب</span>
              </li>

              <li className="flex items-center gap-2.5 text-slate-400">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <CloseIcon className="w-3.5 h-3.5" />
                </div>
                <span className="line-through decoration-slate-300">تقارير متقدمة</span>
              </li>
            </ul>

          </div>

          <button
            type="button"
            onClick={() => showToast('أنت بالفعل تستخدم الخطة الأساسية المجانية.')}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer font-alexandria shadow-2xs"
          >
            ابدأ الآن
          </button>
        </div>

        {/* CARD 2: ADVANCED / المتقدمة (NAVY BLUE HIGHLIGHTED) */}
        <div className="bg-[#0b1d3a] text-white rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl transition-all p-7 flex flex-col justify-between space-y-6 relative md:-translate-y-2">
          
          {/* Top Green "Most Popular" Pill */}
          <div className="flex items-center justify-between">
            <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs font-alexandria">
              الأكثر طلباً
            </span>
            <span className="bg-slate-800/80 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-1 rounded-full font-alexandria">
              المتقدمة
            </span>
          </div>

          <div className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5 font-alexandria">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">99</span>
                <span className="text-base font-bold text-slate-300">ر.س</span>
                <span className="text-xs text-slate-400 font-medium">/ شهرياً</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                للمحلات التجارية المتوسطة والنمو السريع.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs text-slate-200 pt-3 border-t border-slate-700/60">
              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>حتى 100 عميل</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>تنبيهات واتساب آلية</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>تقارير مالية شهرية</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>دعم فني سريع</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCheckout('الخطة المتقدمة', '99', 'شهرياً')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer font-alexandria shadow-lg shadow-emerald-950/40 hover:scale-[1.02]"
          >
            اشترك الآن
          </button>
        </div>

        {/* CARD 3: ENTERPRISE / الاحترافية */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-center justify-between">
              <span className="bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold px-3 py-1 rounded-full font-alexandria">
                الاحترافية
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5 font-alexandria">
                <span className="text-3xl font-extrabold text-slate-900">899</span>
                <span className="text-base font-bold text-slate-700">ر.س</span>
                <span className="text-xs text-slate-400 font-medium">/ سنوياً</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                حلول متكاملة للمؤسسات والشركات الكبيرة.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>عملاء غير محدودين</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>تنبيهات واتساب غير محدودة</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>تصدير بيانات متقدم (Excel/PDF)</span>
              </li>

              <li className="flex items-center gap-2.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>مدير حساب مخصص</span>
              </li>
            </ul>

          </div>

          <button
            type="button"
            onClick={() => handleOpenCheckout('الخطة الاحترافية', '899', 'سنوياً')}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer font-alexandria shadow-2xs"
          >
            اشترك الآن
          </button>
        </div>

      </div>

      {/* COMPARISON TABLE: قارن الميزات */}
      <div className="max-w-6xl mx-auto space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900 font-alexandria text-right">
          قارن الميزات
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-slate-700 font-bold text-xs font-alexandria">
                  <th className="py-4 px-6 text-right w-1/4 bg-slate-50/70">الميزة</th>
                  <th className="py-4 px-6 w-1/4 bg-slate-50/70">الأساسية</th>
                  <th className="py-4 px-6 w-1/4 bg-blue-50/60 text-[#0b1d3a] font-extrabold">المتقدمة</th>
                  <th className="py-4 px-6 w-1/4 bg-slate-50/70">الاحترافية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1: Number of Clients */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-right font-semibold text-slate-800">
                    عدد العملاء
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600 font-mono">
                    10
                  </td>
                  <td className="py-4 px-6 font-bold text-[#0b1d3a] bg-blue-50/30 font-mono">
                    100
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    غير محدود
                  </td>
                </tr>

                {/* Row 2: WhatsApp Reminders */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-right font-semibold text-slate-800">
                    تنبيهات واتساب
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <CloseIcon className="w-4 h-4 mx-auto text-slate-400" />
                  </td>
                  <td className="py-4 px-6 bg-blue-50/30">
                    <Check className="w-5 h-5 mx-auto text-emerald-600 stroke-[3]" />
                  </td>
                  <td className="py-4 px-6">
                    <Check className="w-5 h-5 mx-auto text-emerald-600 stroke-[3]" />
                  </td>
                </tr>

                {/* Row 3: Financial Reports */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-right font-semibold text-slate-800">
                    التقارير المالية
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600">
                    أساسية
                  </td>
                  <td className="py-4 px-6 font-bold text-[#0b1d3a] bg-blue-50/30">
                    متقدمة
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    تحليلية كاملة
                  </td>
                </tr>

                {/* Row 4: Technical Support */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-right font-semibold text-slate-800">
                    الدعم الفني
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600">
                    عبر الإيميل
                  </td>
                  <td className="py-4 px-6 font-bold text-[#0b1d3a] bg-blue-50/30">
                    واتساب + هاتف
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    مدير حساب خاص
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM ENTERPRISE / CUSTOM SOLUTION BANNER */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          
          <div className="space-y-1.5 text-right flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-alexandria">
              هل تحتاج إلى حلول مخصصة لمؤسستك؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
              نوفر حلولاً مخصصة للشركات الكبيرة مع إمكانية الربط التقني (API) وأنظمة إدارة متعددة الفروع.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 bg-[#0b1d3a] hover:bg-[#162c52] text-white px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer font-alexandria"
          >
            <span>تواصل معنا</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* SUBSCRIBE / PAYMENT MODAL */}
      {isSubscribeModalOpen && activeCheckoutPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-right border border-slate-100 animate-in zoom-in-95 duration-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-alexandria">
                  تأكيد الاشتراك في {activeCheckoutPlan.name}
                </h3>
                <p className="text-xs text-slate-400">بوابة الدفع الآمنة المعتمدة</p>
              </div>
              <button
                onClick={() => setIsSubscribeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الخطة المختارة:</span>
                <span className="font-bold text-slate-900 font-alexandria">{activeCheckoutPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">فترة الفوترة:</span>
                <span className="font-semibold text-slate-800">{activeCheckoutPlan.period}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="text-slate-800 font-bold">المبلغ الإجمالي:</span>
                <span className="text-xl font-extrabold text-emerald-600 font-alexandria">
                  {activeCheckoutPlan.price} ر.س
                </span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">طريقة الدفع:</span>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="border-2 border-emerald-500 bg-emerald-50/30 text-slate-800 font-bold p-2.5 rounded-xl text-xs text-center cursor-pointer">
                  بطاقة مدى
                </button>
                <button type="button" className="border border-slate-200 hover:border-slate-300 text-slate-700 font-bold p-2.5 rounded-xl text-xs text-center cursor-pointer">
                  Apple Pay
                </button>
                <button type="button" className="border border-slate-200 hover:border-slate-300 text-slate-700 font-bold p-2.5 rounded-xl text-xs text-center cursor-pointer">
                  سداد
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmSubscription}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer font-alexandria shadow-md"
              >
                تأكيد ودفع
              </button>
              <button
                type="button"
                onClick={() => setIsSubscribeModalOpen(false)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
