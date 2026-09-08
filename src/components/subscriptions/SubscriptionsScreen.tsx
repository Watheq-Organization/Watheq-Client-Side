import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';

interface Plan {
  id: 'basic' | 'advanced' | 'professional';
  name: string;
  badge: string;
  badgeType: 'basic' | 'advanced' | 'professional';
  price: string;
  period?: string;
  description: string;
  isPopular?: boolean;
  features: { text: string; included: boolean }[];
  buttonText: string;
  buttonVariant: 'outline' | 'featured' | 'secondary';
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'الأساسية',
    badge: 'الأساسية',
    badgeType: 'basic',
    price: 'مجانية',
    description: 'للتجار المبتدئين في تنظيم ديونهم.',
    features: [
      { text: 'حتى 10 عملاء', included: true },
      { text: 'توثيق ديون أساسي', included: true },
      { text: 'تنبيهات واتساب', included: false },
      { text: 'تقارير متقدمة', included: false },
    ],
    buttonText: 'ابدأ الآن',
    buttonVariant: 'secondary',
  },
  {
    id: 'advanced',
    name: 'المتقدمة',
    badge: 'المتقدمة',
    badgeType: 'advanced',
    price: '99 ر.س',
    period: '/شهرياً',
    description: 'للمحلات التجارية المتوسطة والنمو السريع.',
    isPopular: true,
    features: [
      { text: 'حتى 100 عميل', included: true },
      { text: 'تنبيهات واتساب آلية', included: true },
      { text: 'تقارير مالية شهرية', included: true },
      { text: 'دعم فني سريع', included: true },
    ],
    buttonText: 'اشترك الآن',
    buttonVariant: 'featured',
  },
  {
    id: 'professional',
    name: 'الاحترافية',
    badge: 'الاحترافية',
    badgeType: 'professional',
    price: '899 ر.س',
    period: '/سنوياً',
    description: 'حلول متكاملة للمؤسسات والشركات الكبيرة.',
    features: [
      { text: 'عملاء غير محدودين', included: true },
      { text: 'تنبيهات واتساب غير محدودة', included: true },
      { text: 'تصدير بيانات متقدم (Excel/PDF)', included: true },
      { text: 'مدير حساب مخصص', included: true },
    ],
    buttonText: 'اشترك الآن',
    buttonVariant: 'outline',
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'عدد العملاء',
    basic: '10',
    advanced: '100',
    professional: 'غير محدود',
  },
  {
    feature: 'تنبيهات واتساب',
    basic: false,
    advanced: true,
    professional: true,
  },
  {
    feature: 'التقارير المالية',
    basic: 'أساسية',
    advanced: 'متقدمة',
    professional: 'تحليلية كاملة',
  },
  {
    feature: 'الدعم الفني',
    basic: 'عبر الإيميل',
    advanced: 'واتساب + هاتف',
    professional: 'مدير حساب خاص',
  },
];

export const SubscriptionsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'visa' | 'apple_pay' | 'stc_pay'>('mada');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOpenPlanModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsSuccess(false);
  };

  const handleClosePlanModal = () => {
    setSelectedPlan(null);
    setIsProcessing(false);
    setIsSuccess(false);
  };

  const handleConfirmSubscription = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedPlan(null);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-cairo antialiased" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="subscriptions"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-tajawal text-[#051838] tracking-tight mb-3">
              اختر الخطة المناسبة لنمو أعمالك
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">
              خطط مرنة مصممة لتلبية احتياجات التجار والمؤسسات باختلاف أحجامها.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const isDark = plan.isPopular;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 ${
                    isDark
                      ? 'bg-[#051838] text-white shadow-2xl ring-4 ring-[#051838]/10 md:-translate-y-3 z-10'
                      : 'bg-white text-slate-800 border border-slate-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div>
                    {/* Badges Header */}
                    <div className="flex items-center justify-between mb-5">
                      {isDark ? (
                        <>
                          <span className="bg-[#22c55e] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            الأكثر طلباً
                          </span>
                          <span className="bg-white/10 text-blue-100 text-xs font-medium px-3.5 py-1 rounded-full border border-white/15">
                            {plan.badge}
                          </span>
                        </>
                      ) : (
                        <div className="w-full flex justify-center">
                          <span
                            className={`text-xs font-bold px-4 py-1 rounded-full ${
                              plan.badgeType === 'basic'
                                ? 'bg-[#e0f2fe] text-[#0284c7]'
                                : 'bg-[#ede9fe] text-[#6366f1]'
                            }`}
                          >
                            {plan.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Title */}
                    <div className="text-center mb-4">
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span
                          className={`text-3xl sm:text-4xl font-black font-tajawal ${
                            isDark ? 'text-white' : 'text-[#051838]'
                          }`}
                        >
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span
                            className={`text-sm font-semibold ${
                              isDark ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {plan.period}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs sm:text-sm mt-2 font-medium ${
                          isDark ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {plan.description}
                      </p>
                    </div>

                    <div
                      className={`h-px w-full my-6 ${
                        isDark ? 'bg-white/10' : 'bg-slate-100'
                      }`}
                    />

                    {/* Features List */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {feat.included ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          )}
                          <span
                            className={`text-sm ${
                              feat.included
                                ? isDark
                                  ? 'text-white font-medium'
                                  : 'text-slate-700 font-medium'
                                : isDark
                                ? 'text-slate-400 line-through'
                                : 'text-slate-400'
                            }`}
                          >
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div>
                    {plan.buttonVariant === 'featured' && (
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(plan)}
                        className="w-full bg-[#058b42] hover:bg-[#047738] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#058b42]/30 transition-all duration-200 cursor-pointer active:scale-98"
                      >
                        {plan.buttonText}
                      </button>
                    )}

                    {plan.buttonVariant === 'outline' && (
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(plan)}
                        className="w-full bg-white hover:bg-slate-50 text-[#051838] border border-[#051838] font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-98"
                      >
                        {plan.buttonText}
                      </button>
                    )}

                    {plan.buttonVariant === 'secondary' && (
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(plan)}
                        className="w-full bg-white hover:bg-slate-50 text-[#051838] border border-slate-300 font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-98"
                      >
                        {plan.buttonText}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Table Section */}
          <div className="max-w-6xl mx-auto mb-14">
            <h2 className="text-xl sm:text-2xl font-bold font-tajawal text-[#051838] mb-6 text-center sm:text-right">
              قارن الميزات
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/90 divide-x divide-x-reverse divide-slate-100">
                    <th className="py-4 px-6 bg-slate-50/70 font-bold text-slate-700 w-1/4">
                      الميزة
                    </th>
                    <th className="py-4 px-6 bg-slate-50/70 font-bold text-slate-700 text-center w-1/4">
                      الأساسية
                    </th>
                    <th className="py-4 px-6 bg-[#eff6ff] font-bold text-[#1e40af] text-center w-1/4 border-x border-blue-100">
                      المتقدمة
                    </th>
                    <th className="py-4 px-6 bg-slate-50/70 font-bold text-slate-700 text-center w-1/4">
                      الاحترافية
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/40 transition-colors divide-x divide-x-reverse divide-slate-100"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {row.feature}
                      </td>

                      {/* Basic */}
                      <td className="py-4 px-6 text-center text-slate-600 font-medium">
                        {typeof row.basic === 'boolean' ? (
                          row.basic ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto stroke-[2.5]" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 mx-auto stroke-[2.5]" />
                          )
                        ) : (
                          row.basic
                        )}
                      </td>

                      {/* Advanced (Highlighted column) */}
                      <td className="py-4 px-6 text-center bg-[#eff6ff]/50 font-semibold text-[#1e40af] border-x border-blue-100">
                        {typeof row.advanced === 'boolean' ? (
                          row.advanced ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto stroke-[2.5]" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 mx-auto stroke-[2.5]" />
                          )
                        ) : (
                          row.advanced
                        )}
                      </td>

                      {/* Professional */}
                      <td className="py-4 px-6 text-center text-slate-800 font-medium">
                        {typeof row.professional === 'boolean' ? (
                          row.professional ? (
                            <Check className="w-5 h-5 text-emerald-600 mx-auto stroke-[2.5]" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 mx-auto stroke-[2.5]" />
                          )
                        ) : (
                          row.professional
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Solutions / Enterprise Banner */}
          <div className="max-w-6xl mx-auto rounded-3xl border border-emerald-200/80 bg-gradient-to-l from-emerald-50/40 via-white to-blue-50/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="text-right space-y-1.5 flex-1">
              <h3 className="text-lg sm:text-xl font-bold font-tajawal text-[#051838]">
                هل تحتاج إلى حلول مخصصة لمؤسستك؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                نوفر حلولاً مخصصة للشركات الكبيرة مع إمكانية الربط التقني (API) وأنظمة إدارة متعددة الفروع.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(PATHS.CONTACT)}
              className="bg-[#071f45] hover:bg-[#051838] text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md shadow-slate-900/10 cursor-pointer shrink-0 active:scale-98"
            >
              <span>تواصل معنا</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Subscription Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClosePlanModal}
              className="absolute left-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold font-tajawal text-[#051838]">
                  تم تفعيل الاشتراك بنجاح!
                </h3>
                <p className="text-sm text-slate-600">
                  شكراً لاختيارك {selectedPlan.name}. تم تحديث حسابك للاستفادة من جميع الميزات فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    تأكيد الاشتراك
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-tajawal text-[#051838] mt-2">
                    الاشتراك في {selectedPlan.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {selectedPlan.description}
                  </p>
                </div>

                {/* Plan Summary Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">المبلغ الإجمالي</span>
                    <span className="text-2xl font-extrabold text-[#051838] font-tajawal">
                      {selectedPlan.price}
                    </span>
                    {selectedPlan.period && (
                      <span className="text-xs text-slate-500 mr-1">{selectedPlan.period}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-emerald-600 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      ضمان استرجاع 14 يوم
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                {selectedPlan.id !== 'basic' && (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700">
                      طريقة الدفع
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mada')}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'mada'
                            ? 'border-[#051838] bg-[#051838]/5 text-[#051838]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>بطاقة مدى</span>
                        <CreditCard className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('visa')}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'visa'
                            ? 'border-[#051838] bg-[#051838]/5 text-[#051838]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>فيزا / ماستركارد</span>
                        <CreditCard className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('apple_pay')}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'apple_pay'
                            ? 'border-[#051838] bg-[#051838]/5 text-[#051838]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>Apple Pay</span>
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stc_pay')}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'stc_pay'
                            ? 'border-[#051838] bg-[#051838]/5 text-[#051838]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>STC Pay</span>
                        <Building2 className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleConfirmSubscription}
                    className="w-full bg-[#051838] hover:bg-[#092c63] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span>جاري معالجة الطلب...</span>
                    ) : selectedPlan.id === 'basic' ? (
                      <span>تأكيد تفعيل الخطة المجانية</span>
                    ) : (
                      <span>إتمام الاشتراك والدفع</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsScreen;
