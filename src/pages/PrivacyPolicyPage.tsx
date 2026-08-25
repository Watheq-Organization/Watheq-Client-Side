import { useEffect, useState } from 'react';
import type { FC, ComponentType } from 'react';
import { Database, BarChart3, ShieldCheck, Cookie } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

/**
 * Privacy Policy page (سياسة الخصوصية).
 *
 * Reuses the shared Navbar/Footer and the card/typography/color patterns
 * already established in ContactPage.tsx and the auth pages (navy
 * `#0c2444` headings, `font-tajawal` for titles, emerald icon badges,
 * `bg-slate-50` muted highlight boxes, `rounded-2xl`/`rounded-xl` cards).
 * No new design tokens are introduced.
 */

interface PolicySection {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
}

const SECTIONS: PolicySection[] = [
  { id: 'data-collection', title: 'جمع البيانات', icon: Database },
  { id: 'data-usage', title: 'استخدام المعلومات', icon: BarChart3 },
  { id: 'data-protection', title: 'حماية البيانات', icon: ShieldCheck },
  { id: 'cookies', title: 'ملفات تعريف الارتباط', icon: Cookie },
];

export const PrivacyPolicyPage: FC = () => {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-112px 0px -55% 0px', threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleTocClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        {/* Page Title & Description */}
        <div className="text-right mb-8 lg:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
            سياسة الخصوصية
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-3">تاريخ آخر تحديث: 15 أكتوبر 2024</p>
          <div className="mt-6 border-t border-slate-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Right (Main Content) */}
          <div className="lg:col-span-2 w-full order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-100 space-y-10">
              {/* Section 1: جمع البيانات */}
              <section id="data-collection" className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="space-y-3 text-right flex-1">
                    <h2 className="font-bold text-[#0c2444] text-lg sm:text-xl font-tajawal">
                      جمع البيانات
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      نحن في "وثّق" نلتزم بحماية خصوصيتك. عندما تستخدم منصتنا لإدارة الديون، نقوم
                      بجمع أنواع معينة من المعلومات لتحسين تجربتك وضمان دقة السجلات المالية.
                    </p>
                    <ul className="space-y-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                      <li className="flex items-start gap-2 justify-end">
                        <span>المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف).</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                      <li className="flex items-start gap-2 justify-end">
                        <span>البيانات المالية المتعلقة بالديون والمعاملات.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                      <li className="flex items-start gap-2 justify-end">
                        <span>بيانات السجل الفني ومعلومات الجهاز المستخدم.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: استخدام المعلومات */}
              <section id="data-usage" className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="space-y-3 text-right flex-1">
                    <h2 className="font-bold text-[#0c2444] text-lg sm:text-xl font-tajawal">
                      استخدام المعلومات
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      تُستخدم المعلومات التي نجمعها بشكل أساسي لتقديم خدمات "وثّق" وصيانتها
                      وتحسينها. يشمل ذلك:
                    </p>
                    <ul className="space-y-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                      <li className="flex items-start gap-2 justify-end">
                        <span>توثيق المعاملات وإدارة السجلات المالية بدقة.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                      <li className="flex items-start gap-2 justify-end">
                        <span>التواصل معك بشأن حسابك وتحديثات الخدمة.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                      <li className="flex items-start gap-2 justify-end">
                        <span>منع الاحتيال وضمان أمان المنصة.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3: حماية البيانات */}
              <section id="data-protection" className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-3 text-right flex-1">
                    <h2 className="font-bold text-[#0c2444] text-lg sm:text-xl font-tajawal">
                      حماية البيانات
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      نطبق تدابير أمنية صارمة، فنية وتنظيمية، لحماية معلوماتك من الوصول غير
                      المصرح به، التعديل، الإفصاح، أو الإتلاف.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm sm:text-base text-slate-700 leading-relaxed">
                      تُشفّر جميع البيانات المالية الحساسة أثناء النقل والتخزين باستخدام أحدث
                      بروتوكولات التشفير المتوافقة مع معايير الصناعة.
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: ملفات تعريف الارتباط */}
              <section id="cookies" className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <Cookie className="w-6 h-6" />
                  </div>
                  <div className="space-y-3 text-right flex-1">
                    <h2 className="font-bold text-[#0c2444] text-lg sm:text-xl font-tajawal">
                      ملفات تعريف الارتباط
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتحليل حركة المرور، تخصيص
                      المحتوى، وتحسين تجربة المستخدم الشاملة.
                    </p>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.
                      يرجى ملاحظة أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على وظائف منصة
                      "وثّق".
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Left (Sidebar: Table of Contents) */}
          <div className="lg:col-span-1 w-full order-1 lg:order-2">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm lg:sticky lg:top-28">
              <h2 className="font-bold text-[#0c2444] text-base mb-4 text-right font-tajawal">
                جدول المحتويات
              </h2>
              <nav className="flex flex-col gap-1">
                {SECTIONS.map((section) => {
                  const isActive = activeId === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTocClick(section.id);
                      }}
                      className={`text-right text-sm py-2 px-3 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'font-bold text-emerald-700 bg-emerald-50'
                          : 'font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                      }`}
                    >
                      {section.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
