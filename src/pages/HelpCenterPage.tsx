import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserCheck,
  FileText,
  MessageSquare,
  CreditCard,
  Calendar,
  ChevronLeft,
  Headphones,
  MessageCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PATHS } from '../routes/paths';

interface CategoryItem {
  id: string;
  title: string;
  description: string;
  icon: typeof UserCheck;
  articlesCount: number;
}

interface ArticleItem {
  id: string;
  title: string;
  updatedAt: string;
  category: string;
  content: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'account',
    title: 'تسجيل الحساب',
    description: 'أدلة خطوة بخطوة لإنشاء وإعداد حساب التاجر الخاص بك بنجاح.',
    icon: UserCheck,
    articlesCount: 5,
  },
  {
    id: 'debts',
    title: 'إدارة الديون',
    description: 'كيفية إضافة، توثيق، وتتبع الديون المستحقة عبر لوحة التحكم.',
    icon: FileText,
    articlesCount: 8,
  },
  {
    id: 'whatsapp',
    title: 'تذكيرات واتساب',
    description: 'إعداد وتخصيص رسائل التذكير الآلية للعملاء عبر منصة واتساب.',
    icon: MessageSquare,
    articlesCount: 6,
  },
  {
    id: 'payments',
    title: 'الدفع والتسويات',
    description: 'معلومات حول بوابات الدفع، تحديث حالة المبالغ، والتقارير المالية.',
    icon: CreditCard,
    articlesCount: 7,
  },
];

const POPULAR_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: 'كيفية توثيق دين جديد بالنظام',
    updatedAt: 'تم التحديث منذ يومين',
    category: 'إدارة الديون',
    content: `لتوثيق دين جديد في نظام وثّق:
1. توجه إلى لوحة التحكم واختر "إضافة دين جديد".
2. قم بإدخال بيانات المدين (الاسم ورقم الهاتف ورقم الهوية أو السجل التجاري).
3. حدد مبلغ الدين وتاريخ الاستحقاق وإرفاق المستندات الداعمة إن وجدت.
4. اضغط على "حفظ وتوثيق" ليتم إرسال إشعار التوثيق فورا للمدين عبر الرسائل النصية والواتساب.`,
  },
  {
    id: 'art-2',
    title: 'حل مشكلة عدم وصول رسائل واتساب',
    updatedAt: 'تم التحديث الأسبوع الماضي',
    category: 'تذكيرات واتساب',
    content: `في حال عدم وصول تذكيرات الواتساب:
1. تأكد من صحة رقم هاتف العميل وكتابة مفتاح الدولة بصيغة دولية صحيحة (+966).
2. تحقق من حالة ربط خدمة واتساب في إعدادات المتجر لديك.
3. تأكد من أن حساب العميل لم يقم بحظر الرقم الآلي للتنبيهات.
4. إذا استمرت المشكلة، تواصل مباشرة مع فريق الدعم الفني لمراجعة سجلات الإرسال.`,
  },
  {
    id: 'art-3',
    title: 'تغيير حالة الدين إلى "تم الدفع"',
    updatedAt: 'تم التحديث منذ أسبوعين',
    category: 'الدفع والتسويات',
    content: `عند استلامك للمبلغ المستحق:
1. افتح صفحة "سجل الديون" من القائمة الجانبية.
2. ابحث عن المعاملة المعنية واضغط على زر "إجراءات" ثم اختر "تأكيد السداد".
3. اختر طريقة الدفع (تحويل بنكي / نقدي / بوابة إلكترونية) واكتب أي ملاحظات إضافية.
4. سيتم تحديث حالة الدين تلقائياً إلى "تم الدفع" وإرسال إيصال مخالصة رسمي للمدين.`,
  },
];

export const HelpCenterPage: FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = CATEGORIES.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = POPULAR_ARTICLES.filter(
    (art) =>
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16 space-y-16">
        {/* Hero Section: Search Header */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
            كيف يمكننا مساعدتك اليوم؟
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            ابحث في قاعدة المعرفة الخاصة بنا أو تصفح الفئات أدناه للعثور على إجابات سريعة لاستفساراتك.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto mt-6">
            <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200 shadow-lg shadow-slate-200/50 flex items-center gap-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <div className="flex-grow flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن مقالات، أسئلة شائعة، أو أدلة..."
                  className="w-full bg-transparent border-none text-slate-800 text-sm sm:text-base focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="bg-[#0c2444] hover:bg-[#123663] text-white px-6 sm:px-8 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95 flex-shrink-0 cursor-pointer"
              >
                بحث
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Browse By Category */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0c2444] font-tajawal">
              تصفح حسب الفئة
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredCategories.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`bg-white rounded-2xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-right group ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0c2444] text-lg font-tajawal group-hover:text-emerald-700 transition-colors mb-2">
                        {cat.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Popular Articles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0c2444] font-tajawal">
              المقالات الشائعة
            </h2>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3 text-right">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-600 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all flex-shrink-0 mt-0.5" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 pt-4 mt-2 border-t border-slate-50">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{article.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Didn't Find What You're Looking For? (Dark Navy CTA) */}
        <section className="rounded-3xl bg-[#0c2444] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            {/* Glowing Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-inner">
              <Headphones className="w-8 h-8 text-sky-300" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-tajawal text-white">
              لم تجد ما تبحث عنه؟
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              فريق الدعم الفني لدينا متاح على مدار الساعة طوال أيام الأسبوع لمساعدتك في أي مشكلة أو
              استفسار.
            </p>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate(PATHS.CONTACT)}
                className="bg-white text-[#0c2444] hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>تحدث معنا الآن</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right space-y-5 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-2">
                  {selectedArticle.category}
                </span>
                <h3 className="text-xl font-bold text-[#0c2444] font-tajawal">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line py-2">
              {selectedArticle.content}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>معتمد من فريق الدعم</span>
              </div>
              <span>{selectedArticle.updatedAt}</span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
