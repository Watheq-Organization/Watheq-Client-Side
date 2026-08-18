import React, { useState, useRef } from 'react';
import { 
  BellRing, 
  MessageSquare, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  RotateCcw, 
  Send,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { ScreenType } from './Header';

interface RemindersAutomationViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const RemindersAutomationView: React.FC<RemindersAutomationViewProps> = ({ onNavigate }) => {
  // Automation settings state
  const [isAutomationEnabled, setIsAutomationEnabled] = useState<boolean>(true);
  
  // Schedules toggles
  const [remindBefore, setRemindBefore] = useState<boolean>(true);
  const [remindOnDay, setRemindOnDay] = useState<boolean>(true);
  const [remindOverdue, setRemindOverdue] = useState<boolean>(false);

  // Message template
  const defaultTemplate = 'عزيزي [اسم_العميل]، نود تذكيركم بأن هناك مبلغاً مستحقاً وقدره [المبلغ_المستحق] ريال سعودي. يرجى المبادرة بالسداد قبل تاريخ [تاريخ_الاستحقاق] عبر الرابط التالي: [رابط_الدفع]. شكراً لتعاونكم مع واثق.';
  const [messageTemplate, setMessageTemplate] = useState<string>(defaultTemplate);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Variable chip insertion helper
  const insertVariable = (variableTag: string) => {
    if (!textareaRef.current) {
      setMessageTemplate(prev => prev + ' ' + variableTag);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = messageTemplate;
    const newText = text.substring(0, start) + variableTag + text.substring(end);
    setMessageTemplate(newText);
    
    // Reset focus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variableTag.length, start + variableTag.length);
      }
    }, 50);
  };

  const handleSaveSettings = () => {
    showToast('تم حفظ إعدادات الأتمتة وجدولة تذكيرات واتساب بنجاح!');
  };

  const handleResetSettings = () => {
    setMessageTemplate(defaultTemplate);
    setRemindBefore(true);
    setRemindOnDay(true);
    setRemindOverdue(false);
    setIsAutomationEnabled(true);
    showToast('تمت استعادة الإعدادات الافتراضية.');
  };

  // Generate simulated preview message
  const previewMessage = messageTemplate
    .replace(/\[اسم_العميل\]/g, 'محمد العتيبي')
    .replace(/\[المبلغ_المستحق\]/g, '4,500.00')
    .replace(/\[تاريخ_الاستحقاق\]/g, '25 أكتوبر 2023')
    .replace(/\[رابط_الدفع\]/g, 'https://watheq.sa/pay/w8901');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
          الأتمتة والتنبيهات
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          إدارة قنوات الإرسال التلقائي والتنبيهات المجدولة للعملاء.
        </p>
      </div>

      {/* WHATSAPP HERO BANNER (DARK NAVY THEME AS IN IMAGE) */}
      <div className="relative overflow-hidden bg-[#0b1d3a] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-2.5">
          
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>حساب واتساب رسمي موثق (Green Tick)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold font-alexandria tracking-tight text-white">
            أتمتة تذكيرات واتساب
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
            ارفع كفاءة التحصيل عبر إرسال تنبيهات تلقائية لعملائك قبل وبعد تاريخ الاستحقاق بكل سهولة وأمان عبر تطبيق واتساب الموثق.
          </p>
        </div>

        {/* Decorative background gradients & watermark */}
        <div className="absolute left-[-20px] top-[-20px] w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 bottom-6 opacity-10 pointer-events-none hidden md:block">
          <MessageSquare className="w-40 h-40 text-white" />
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN IN RTL (4 cols): Quota & Usage Card */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 font-alexandria">
                استهلاك باقة إرسال الرسائل الموثقة
              </h3>
            </div>

            {/* Quota Progress Numbers */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">الرسائل المرسلة</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-xl font-extrabold text-slate-900 font-alexandria">1,240</span>
                  <span className="text-xs text-slate-400">/ 5,000</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700" 
                  style={{ width: '24.8%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>المتبقي: 3,760 رسالة</span>
                <span>24.8% مستهلك</span>
              </div>
            </div>

            {/* Expiration Note */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>تنتهي صلاحية الباقة خلال 14 يوماً</span>
            </div>

            {/* Upgrade Plan Button */}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>ترقية باقة الإرسال</span>
            </button>
          </div>

          {/* Quick Statistics or Tips Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>زيادة سرعة التحصيل +48%</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              إرسال تذكيرات الواتساب قبل موعد الاستحقاق بـ 3 أيام يرفع نسبة السداد في الموعد بأكثر من 48%.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN IN RTL (8 cols): Main Automation Setup & Template Editor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: GLOBAL AUTOMATION TOGGLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-alexandria">
                تفعيل الأتمتة الشاملة
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تمكين النظام من إرسال الرسائل تلقائياً بناءً على الجدولة المحددة
              </p>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
              <input
                type="checkbox"
                checked={isAutomationEnabled}
                onChange={(e) => {
                  setIsAutomationEnabled(e.target.checked);
                  showToast(e.target.checked ? 'تم تفعيل الأتمتة الشاملة' : 'تم إيقاف الأتمتة الشاملة مؤقتاً');
                }}
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-emerald-600 shadow-inner" />
            </label>
          </div>

          {/* SECTION 2: REMINDERS SCHEDULES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-alexandria">
                جدولة التذكيرات
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                حدد التوقيتات المناسبة لإرسال الإشعارات للعملاء.
              </p>
            </div>

            <div className="space-y-3">
              
              {/* Reminder 1: 3 Days Before */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remind-before"
                    checked={remindBefore}
                    onChange={(e) => setRemindBefore(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remind-before" className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                    تذكير قبل موعد الاستحقاق (3 أيام)
                  </label>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  remindBefore 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {remindBefore ? 'نشط الآن' : 'معطل حالياً'}
                </span>
              </div>

              {/* Reminder 2: On Due Day */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remind-today"
                    checked={remindOnDay}
                    onChange={(e) => setRemindOnDay(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remind-today" className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                    تذكير في يوم الاستحقاق
                  </label>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  remindOnDay 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {remindOnDay ? 'نشط الآن' : 'معطل حالياً'}
                </span>
              </div>

              {/* Reminder 3: Overdue (Weekly) */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remind-overdue"
                    checked={remindOverdue}
                    onChange={(e) => setRemindOverdue(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remind-overdue" className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                    تذكير للمتأخرات (أسبوعياً)
                  </label>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  remindOverdue 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {remindOverdue ? 'نشط الآن' : 'معطل حالياً'}
                </span>
              </div>

            </div>
          </div>

          {/* SECTION 3: CUSTOM MESSAGE TEMPLATE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-alexandria">
                  قالب الرسالة المخصص
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  انقر على المتغيرات لإدراجها تلقائياً داخل نص الرسالة.
                </p>
              </div>

              <button
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{showLivePreview ? 'إخفاء المعاينة' : 'عرض المعاينة الحية'}</span>
              </button>
            </div>

            {/* Variable Tag Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 ml-1">المتغيرات:</span>
              
              {[
                { tag: '[اسم_العميل]', label: 'اسم العميل' },
                { tag: '[المبلغ_المستحق]', label: 'المبلغ المستحق' },
                { tag: '[تاريخ_الاستحقاق]', label: 'تاريخ الاستحقاق' },
                { tag: '[رابط_الدفع]', label: 'رابط الدفع' },
              ].map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => insertVariable(item.tag)}
                  className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs"
                  title="انقر للإدراج"
                >
                  +{item.tag}
                </button>
              ))}
            </div>

            {/* Textarea Template Editor */}
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                * سيتم توجيه الدافع لصفحة دفع آمنة ومعتمدة تفصل تلقائياً في شبكة سداد.
              </p>
            </div>

            {/* LIVE WHATSAPP CHAT PREVIEW BOX */}
            {showLivePreview && (
              <div className="bg-[#e5ddd5] dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>معاينة حية لشكل الرسالة في واتساب:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">اليوم 10:30 ص</span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="bg-white rounded-2xl rounded-tr-xs p-3.5 shadow-sm text-xs sm:text-sm text-slate-800 max-w-lg leading-relaxed relative border border-slate-100">
                  <p className="whitespace-pre-wrap">{previewMessage}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                    <span>10:30 ص</span>
                    <span className="text-emerald-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM SAVE & CANCEL ACTIONS */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-900/20 cursor-pointer font-alexandria"
              >
                حفظ التعديلات
              </button>

              <button
                type="button"
                onClick={handleResetSettings}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إلغاء التغييرات
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* UPGRADE PACKAGE MODAL */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 text-right border border-slate-100 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 font-alexandria">
                ترقية باقة رسائل واتساب
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                اختر الباقة المناسبة لحجم أعمالك مع ربط فوري وشارة توثيق معتمدة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-emerald-500 bg-emerald-50/30 rounded-2xl p-4 space-y-2 relative">
                <span className="absolute -top-2.5 left-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  الأكثر طلباً
                </span>
                <h4 className="font-bold text-sm text-slate-900 font-alexandria">باقة الأعمال</h4>
                <p className="text-2xl font-extrabold text-slate-900 font-alexandria">199 <span className="text-xs font-bold text-slate-500">ر.س / شهر</span></p>
                <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                  <li className="flex items-center gap-1.5">✓ 10,000 رسالة شهرية</li>
                  <li className="flex items-center gap-1.5">✓ توثيق واتساب الأخضر</li>
                  <li className="flex items-center gap-1.5">✓ قوالب غير محدودة</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-slate-300 transition-colors">
                <h4 className="font-bold text-sm text-slate-900 font-alexandria">باقة الشركات</h4>
                <p className="text-2xl font-extrabold text-slate-900 font-alexandria">499 <span className="text-xs font-bold text-slate-500">ر.س / شهر</span></p>
                <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                  <li className="flex items-center gap-1.5">✓ 50,000 رسالة شهرية</li>
                  <li className="flex items-center gap-1.5">✓ دعم فني مخصص 24/7</li>
                  <li className="flex items-center gap-1.5">✓ ربط API مباشر</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  showToast('تمت ترقية الباقة بنجاح!');
                  setIsUpgradeModalOpen(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                تأكيد الترقية
              </button>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
