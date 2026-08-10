import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react';

interface TermsScreenProps {
  onNavigate: (screen: 'splash' | 'login' | 'signup' | 'contact' | 'privacy' | 'terms') => void;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ onNavigate }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Header currentScreen="terms" onNavigate={onNavigate} brandText="ar" />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 lg:py-12">
        
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200/80">
          
          {/* Title Header */}
          <div className="text-center border-b border-slate-100 pb-8 mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 font-alexandria mb-2">
              شروط الاستخدام
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              آخر تحديث: 24 أكتوبر 2024
            </p>
          </div>

          {/* Section 1: Introduction */}
          <div className="space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
            
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
                <h3>مقدمة</h3>
              </div>
              <p className="pr-9">
                مرحباً بك في منصة <strong>"وثق"</strong>. تحكم هذه الشروط والأحكام استخدامك لمنصة وأدوات إدارة الديون ومحتواها، وبمجرد وصولك إلى المنصة واستخدامها، فإنك توافق التزاماً تاماً بهذه الشروط.
              </p>
            </section>

            {/* Section 2: Eligibility */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                <h3>أهلية الاستخدام</h3>
              </div>
              <ul className="pr-9 space-y-1.5 list-disc pr-14">
                <li>يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام هذه المنصة.</li>
                <li>يجب أن تكون ممثلاً قانونياً ومصرحاً له بتمثيل المؤسسة أو الكيان التجاري الذي تستخدم المنصة نيابة عنه.</li>
                <li>تلتزم بتقديم معلومات دقيقة وصحيحة ومحدثة أثناء عملية التسجيل والاستخدام.</li>
              </ul>
            </section>

            {/* Section 3: Accounts & Security */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
                <h3>الحسابات والأمان</h3>
              </div>
              <p className="pr-9">
                أنت مسؤول بالكامل عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بحسابك، وأي نشاط يقع تحت حسابك يعتبر مسؤوليتك الشخصية أو مسؤولية الكيان التجاري التابع له.
              </p>
              
              {/* Highlight Warning Box */}
              <div className="mr-9 bg-amber-50 border-r-4 border-amber-500 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>ملاحظة هامة:</strong> يجب الإبلاغ فوراً عن أي خرق أمني أو وصول غير مصرح به للحسابات.
                </span>
              </div>
            </section>

            {/* Section 4: Data Entry & Verification */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">4</span>
                <h3>إدخال البيانات والتحقق</h3>
              </div>
              <p className="pr-9">
                يتحمل المستخدم مسؤوليته الكاملة عن إدخال وتوثيق البيانات المالية والتفاصيل المتعلقة بالمعاملات والديون التي يتم إدراجها في النظام دقيقة ومستندة إلى معاملات حقيقية وموثوقة، وتتحمل المسؤولية القانونية الكاملة عن صحة المبالغ والتعهدات بين الدائن والمدين.
              </p>
            </section>

            {/* Section 5: Intellectual Property */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">5</span>
                <h3>الملكية الفكرية</h3>
              </div>
              <p className="pr-9">
                جميع حقوق الملكية الفكرية في المنصة، بما في ذلك البرمجيات والشعارات والتصاميم والمحتوى هي ملك حصري لمنصة <strong>"وثق"</strong>. ولا يجوز نسخ أو تعديل أو توزيع أو استخراج الكود المصدري دون إذن كتابي صريح.
              </p>
            </section>

            {/* Section 6: Disclaimer */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-alexandria">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">6</span>
                <h3>إخلاء المسؤولية</h3>
              </div>
              <p className="pr-9">
                يتم تقديم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية. منصة وثق لا تتعهد بأن الخدمة ستكون خالية تماماً من الانقطاعات الفنية الطارئة، ولا نتحمل المسؤولية عن أي خسائر غير مباشرة أو نزاعات مالية بين التجار والعملاء.
              </p>
            </section>

          </div>

          {/* Bottom Agreement Action Button */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              بضغطك على الزر، فإنك تؤكد موافقتك الكاملة على جميع شروط الاستخدام أعلاه.
            </div>

            <button
              onClick={() => {
                setAgreed(true);
                setTimeout(() => setAgreed(false), 3000);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              {agreed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم قبول الشروط</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>أوافق على الشروط</span>
                </>
              )}
            </button>
          </div>

        </div>

      </main>

      {/* Dark Navy Footer */}
      <Footer brandName="Watheq" theme="dark" />
    </div>
  );
};
