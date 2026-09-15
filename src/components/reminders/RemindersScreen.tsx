import { useState, useRef } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowUpRight, MessageSquare, Sparkles } from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import { Toast } from '../ui/Toast';

interface ReminderScheduleItem {
  id: string;
  title: string;
  enabled: boolean;
}

const DEFAULT_MESSAGE_TEMPLATE = `عزيزي [اسم_العميل]، نود تذكيركم بأن هناك مبلغاً مستحقاً وقدره [المبلغ_المستحق] ريال سعودي، يرجى المبادرة بالسداد قبل تاريخ [تاريخ_الاستحقاق] عبر الرابط التالي:
[رابط_الدفع]. شكراً لتعاونكم مع وثّق.`;

export const RemindersScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Main state
  const [isGlobalAutomationActive, setIsGlobalAutomationActive] = useState(true);

  const [schedules, setSchedules] = useState<ReminderScheduleItem[]>([
    {
      id: 'before_due',
      title: 'تذكير قبل موعد الاستحقاق (3 أيام)',
      enabled: true,
    },
    {
      id: 'on_due_date',
      title: 'تذكير في يوم الاستحقاق',
      enabled: true,
    },
    {
      id: 'overdue_weekly',
      title: 'تذكير للمتأخرات (أسبوعياً)',
      enabled: false,
    },
  ]);

  const [messageTemplate, setMessageTemplate] = useState<string>(DEFAULT_MESSAGE_TEMPLATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats
  const sentCount = 1240;
  const totalCount = 5000;
  const progressPercent = Math.round((sentCount / totalCount) * 100);

  // Handle schedule toggle
  const handleToggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Insert tag into template at cursor or end
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageTemplate((prev) => `${prev} ${tag}`);
      return;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = messageTemplate;

    const updated =
      currentVal.substring(0, startPos) +
      tag +
      currentVal.substring(endPos, currentVal.length);

    setMessageTemplate(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + tag.length, startPos + tag.length);
    }, 50);
  };

  const handleSaveSettings = () => {
    setToastMessage('تم حفظ إعدادات الأتمتة والتذكيرات بنجاح!');
  };

  const handleResetSettings = () => {
    setIsGlobalAutomationActive(true);
    setSchedules([
      { id: 'before_due', title: 'تذكير قبل موعد الاستحقاق (3 أيام)', enabled: true },
      { id: 'on_due_date', title: 'تذكير في يوم الاستحقاق', enabled: true },
      { id: 'overdue_weekly', title: 'تذكير للمتأخرات (أسبوعياً)', enabled: false },
    ]);
    setMessageTemplate(DEFAULT_MESSAGE_TEMPLATE);
    setToastMessage('تم التراجع عن التعديلات واستعادة الإعدادات الافتراضية.');
  };

  // Live preview message rendered with placeholder values
  const previewText = messageTemplate
    .replace(/\[اسم_العميل\]/g, 'محمد أحمد السعيد')
    .replace(/\[المبلغ_المستحق\]/g, '3,500')
    .replace(/\[تاريخ_الاستحقاق\]/g, '2026/09/25')
    .replace(/\[رابط_الدفع\]/g, 'https://watheq.sa/pay/inv-8921');

  const availableTags = [
    '[اسم_العميل]',
    '[المبلغ_المستحق]',
    '[تاريخ_الاستحقاق]',
    '[رابط_الدفع]',
  ];

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-cairo antialiased"
      dir="rtl"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="reminder-settings"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#051838] tracking-tight">
              الأتمتة والتنبيهات
            </h1>
          </div>

          {/* Hero Navy Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#051838] via-[#092552] to-[#051838] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-white/10">
            <div className="relative z-10 max-w-2xl text-right space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold font-cairo text-white tracking-tight">
                أتمتة تذكيرات واتساب
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
                ارفع كفاءة التحصيل عبر إرسال تنبيهات تلقائية لعملائك قبل وبعد تاريخ الاستحقاق بكل سهولة
                وأمان عبر تطبيق واتساب الموثق.
              </p>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute left-4 -bottom-6 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-10 -top-6 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Grid Layout: Main Settings (Right) & Message Stats/Preview (Left) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right Column: Main Automation Settings (8 cols on lg) */}
            <div className="lg:col-span-8 space-y-6 order-1 lg:order-1">
              {/* Card 1: Comprehensive Automation Toggle */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex items-center justify-between gap-4 transition-all">
                <div className="space-y-1 text-right">
                  <h3 className="text-base sm:text-lg font-bold font-cairo text-[#051838]">
                    تفعيل الأتمتة الشاملة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    تمكين النظام من إرسال الرسائل تلقائياً بناءً على الجدولة المحددة
                  </p>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isGlobalAutomationActive}
                  onClick={() => setIsGlobalAutomationActive(!isGlobalAutomationActive)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isGlobalAutomationActive ? 'bg-[#058b42]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isGlobalAutomationActive ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Card 2: Reminder Scheduling */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="text-right pb-1">
                  <h3 className="text-base sm:text-lg font-bold font-cairo text-[#051838]">
                    جدولة التذكيرات
                  </h3>
                  <div className="h-px bg-slate-100 w-full mt-3" />
                </div>

                {/* Schedule Items List */}
                <div className="space-y-3">
                  {schedules.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSchedule(item.id)}
                      className="w-full bg-[#f8faff] hover:bg-[#f1f6ff] border border-slate-200/70 rounded-xl p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none"
                    >
                      {/* Left: Status Badge */}
                      <div>
                        {item.enabled ? (
                          <span className="inline-flex items-center px-3.5 py-1 rounded-lg text-xs font-bold bg-[#dcfce7] text-[#15803d]">
                            نشط الآن
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f9] text-slate-500">
                            معطل حالياً
                          </span>
                        )}
                      </div>

                      {/* Right: Custom Checkbox and Label */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                          {item.title}
                        </span>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            item.enabled
                              ? 'bg-[#058b42] border-[#058b42] text-white shadow-2xs'
                              : 'bg-white border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {item.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Custom Message Template */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="text-right pb-1">
                  <h3 className="text-base sm:text-lg font-bold font-cairo text-[#051838]">
                    قالب الرسالة المخصص
                  </h3>
                  <div className="h-px bg-slate-100 w-full mt-3" />
                </div>

                {/* Interactive Dynamic Variables Chips */}
                <div className="flex flex-wrap items-center justify-start gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      title="انقر لإدراج هذا الوسم في نص الرسالة"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe] transition-all cursor-pointer active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Message Editor Box */}
                <div className="relative bg-[#f6f9fe] border border-blue-100/90 rounded-2xl p-4 sm:p-5 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-0 resize-none outline-hidden text-sm sm:text-base text-slate-800 leading-relaxed font-cairo text-right placeholder:text-slate-400"
                    placeholder="اكتب قالب رسالة التذكير هنا..."
                  />
                </div>

                {/* Helper Subtext */}
                <p className="text-xs text-slate-400 text-center sm:text-right font-medium">
                  استخدم الوسوم التفاعلية أعلاه لإدراج بيانات العميل تلقائياً في الرسالة عند الإرسال.
                </p>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-2 flex items-center justify-start gap-3">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="bg-[#058b42] hover:bg-[#047738] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-[#058b42]/20 transition-all cursor-pointer active:scale-98"
                >
                  حفظ الإعدادات
                </button>

                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-98"
                >
                  إلغاء التغييرات
                </button>
              </div>
            </div>

            {/* Left Column: Stats & Live Message Preview (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4 order-2 lg:order-2">
              {/* Top Header Label */}
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500">
                  معاينة حية لشكل الرسالة المرسلة
                </span>
              </div>

              {/* Card: Message Consumption Statistics */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold font-cairo text-slate-800 text-right">
                  إحصائيات استهلاك الرسائل
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#051838] font-bold text-sm font-cairo">
                      {sentCount.toLocaleString()} / {totalCount.toLocaleString()}
                    </span>
                    <span className="text-slate-500">الرسائل المرسلة</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#051838] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center font-medium pt-1">
                    تنتهي صلاحية الباقة خلال 12 يوماً
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(PATHS.SUBSCRIPTIONS)}
                  className="w-full py-2.5 px-4 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>ترقية باقة الرسائل</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Interactive WhatsApp Live Chat Bubble Mockup */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    <span>معاينة واتساب للعميل</span>
                  </div>
                  <span className="text-[11px] text-slate-400">اليوم 10:30 ص</span>
                </div>

                {/* WhatsApp Chat Balloon */}
                <div className="bg-[#e7f8ec] rounded-2xl p-4 text-right space-y-2 border border-emerald-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>وثّق - إشعار سداد</span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-cairo">
                    {previewText}
                  </p>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>10:30 ص</span>
                    <span className="text-[#38bdf8] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default RemindersScreen;
