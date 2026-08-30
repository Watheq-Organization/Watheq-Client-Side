import type { FC, ReactNode } from 'react';
import {
  PenLine,
  ShieldCheck,
  Lock,
  FileCheck2,
  Copyright,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface TermSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

/**
 * Single numbered section used inside the Terms card. Keeps the
 * heading + icon + paragraph(s) markup identical across all six
 * sections so the page stays easy to scan and extend.
 */
const TermSection: FC<TermSectionProps> = ({ icon, title, children }) => (
  <section className="py-5 first:pt-0">
    <div className="flex items-center gap-2 mb-2.5">
      <h2 className="text-lg sm:text-xl font-bold text-[#0c2444] font-tajawal">{title}</h2>
      <span className="text-emerald-600">{icon}</span>
    </div>
    <div className="text-sm sm:text-[15px] text-slate-600 leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

/**
 * Terms of Use page. Reuses the shared Navbar/Footer exactly as-is and
 * mirrors the design reference: centered white card on a light
 * slate background, numbered sections with green line icons, an
 * important-notice callout, and a centered navy "agree" button.
 * No route existed for this before, so it's wired up in
 * routes/paths.ts + routes/AppRoutes.tsx and linked from the Footer.
 */
export const TermsPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-800 font-cairo antialiased">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {/* Card Header */}
          <div className="text-right pb-5 mb-5 border-b border-slate-100">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
              شروط الاستخدام
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">آخر تحديث: 24 أكتوبر 2024</p>
          </div>

          {/* Sections */}
          <div className="divide-y divide-slate-100">
            <TermSection icon={<PenLine className="w-5 h-5" />} title="1. مقدمة">
              <p>
                مرحباً بكم في وثّق. تحكم هذه الشروط والأحكام وصولكم واستخدامكم لمنصة وثّق لإدارة
                الديون. بمجرد وصولكم إلى المنصة، فإنكم توافقون على الالتزام بهذه الشروط.
              </p>
            </TermSection>

            <TermSection icon={<ShieldCheck className="w-5 h-5" />} title="2. أهلية الاستخدام">
              <p>يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام خدماتنا.</p>
              <p>
                يجب أن تكون ممثلاً قانونياً ومصرحاً لك بتمثيل المؤسسة أو الكيان التجاري الذي تستخدم
                المنصة نيابة عنه.
              </p>
              <p>توافق على تقديم معلومات دقيقة وكاملة ومحدثة أثناء عملية التسجيل.</p>
            </TermSection>

            <TermSection icon={<Lock className="w-5 h-5" />} title="3. الحسابات والأمان">
              <p>
                أنت مسؤول بالكامل على الحفاظ على سرية بيانات اعتماد تسجيل الدخول الخاصة بك. أي
                نشاط يحدث تحت حسابك يعتبر مسؤوليتك الشخصية أو مسؤولية المؤسسة التي تمثلها.
              </p>
            </TermSection>

            {/* Important Notice */}
            <div className="my-5 py-4 pr-4 pl-4 bg-blue-50 border-r-4 border-emerald-500 rounded-lg text-right">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-bold">ملاحظة هامة:</span> يجب إخطار إدارة وثّق فوراً في حال
                الاشتباه بأي وصول غير مصرح به لحسابكم.
              </p>
            </div>

            <TermSection icon={<FileCheck2 className="w-5 h-5" />} title="4. إدخال البيانات والتحقق">
              <p>
                بصفتك تاجراً، أنت توافق على أن جميع البيانات المالية والتفاصيل المتعلقة بالعملاء
                والديون التي يتم إدخالها في النظام دقيقة ومستندة إلى معاملات حقيقية وقابلة للإثبات.
                منصة وثّق توفر أدوات التوثيق ولكن المسؤولية القانونية عن صحة المبالغ تقع على عاتق
                الناجر.
              </p>
            </TermSection>

            <TermSection icon={<Copyright className="w-5 h-5" />} title="5. الملكية الفكرية">
              <p>
                جميع حقوق الملكية الفكرية في المنصة، بما في ذلك البرمجيات والتصميم والشعارات (بما
                في ذلك العلامة التجارية "وثّق") مملوكة بالكامل لشركة وثّق. لا يجوز لك نسخ أو تعديل
                أو توزيع أو استخراج الكود المصدري للمنصة دون إذن كتابي مسبق.
              </p>
            </TermSection>

            <TermSection icon={<AlertTriangle className="w-5 h-5" />} title="6. إخلاء المسؤولية">
              <p>
                يتم توفير خدمات وثّق كما هي "دون أي ضمانات صريحة أو ضمنية. نحن لا نضمن أن المنصة
                ستكون خالية من الأخطاء أو الانقطاعات. وثّق غير مسؤولة عن أي خسائر مالية أو أضرار غير
                مباشرة تنشأ عن استخدام المنصة أو عدم القدرة على استخدامها أو عن النزاعات بين التجار
                والعملاء.
              </p>
            </TermSection>
          </div>

          {/* Bottom Action */}
          <div className="pt-6 mt-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              className="bg-[#0c2444] hover:bg-[#123663] text-white px-10 py-3 rounded-lg text-sm sm:text-base font-bold shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              أوافق على الشروط
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
