import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import {
  Bell,
  HelpCircle,
  Menu,
  Pencil,
  Award,
  User,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  Check,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import {
  getMerchantProfile,
  updateMerchantProfile,
  getStoredReminderSettings,
  setStoredReminderSettings,
  DEFAULT_MERCHANT_PROFILE,
} from '../../services/merchantProfileService';
import type { MerchantProfile } from '../../services/merchantProfileService';

export const SettingsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'whatsapp' | 'security' | 'preferences'>('profile');

  // Profile state
  const [profile, setProfile] = useState<MerchantProfile>(DEFAULT_MERCHANT_PROFILE);
  const [formData, setFormData] = useState<MerchantProfile>(DEFAULT_MERCHANT_PROFILE);
  const [avatarPreview, setAvatarPreview] = useState<string>('/merchant-avatar.jpg');
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reminder & WhatsApp state
  const [autoReminder, setAutoReminder] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState(
    'مرحباً [اسم_العميل]، نذكركم بقرب موعد سداد الدفعة المستحقة بقيمة [المبلغ] لمؤسسة [اسم_المؤسسة]. شكراً لتعاونكم.'
  );

  // UI status
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // 1. Load reminder settings
    const storedReminders = getStoredReminderSettings();
    setAutoReminder(storedReminders.autoReminderEnabled);
    setMessageTemplate(storedReminders.messageTemplate);

    // 2. Load merchant profile (from backend or local registered data)
    setIsLoadingProfile(true);
    getMerchantProfile()
      .then((data) => {
        setProfile(data);
        setFormData(data);
        if (data.profileImagePath) {
          setAvatarPreview(data.profileImagePath);
        }
      })
      .catch(() => {
        // Fallback already handled inside getMerchantProfile
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAvatarPreview(base64);
          setFormData((prev) => ({ ...prev, profileImagePath: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update merchant profile through the API
      const updated = await updateMerchantProfile(formData, selectedFile);
      setProfile(updated);

      // 2. Save reminder settings
      setStoredReminderSettings({
        autoReminderEnabled: autoReminder,
        messageTemplate: messageTemplate,
      });

      showToast('تم حفظ التغييرات بنجاح!');
    } catch {
      showToast('حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة لاحقاً.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReminderSettings = () => {
    setStoredReminderSettings({
      autoReminderEnabled: autoReminder,
      messageTemplate: messageTemplate,
    });
    showToast('تم تحديث إعدادات التذكير بنجاح!');
  };

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all ${
              toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="settings"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <header className="w-full bg-white border-b border-slate-100/90 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Right side in RTL: Title & Mobile menu trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold font-tajawal text-slate-900 tracking-tight">
              الإعدادات
            </h1>
          </div>

          {/* Left side in RTL: Actions & User Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-600 hover:text-[#0c2444] hover:bg-slate-50 transition-colors"
              title="التنبيهات"
              aria-label="التنبيهات"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Help Icon */}
            <button
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-[#0c2444] hover:bg-slate-50 transition-colors"
              title="مركز المساعدة"
              aria-label="مركز المساعدة"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pr-1 sm:pr-2 border-r border-slate-100">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden shadow-xs cursor-pointer hover:ring-[#051838]/20 transition-all">
                <img
                  src={avatarPreview}
                  alt="صورة المستخدم"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Settings Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Main Grid: Left content (forms) + Right column (profile, plan, tabs) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Section in visual layout (8 cols in desktop): Profile & WhatsApp Forms */}
            <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
              {/* Card 1: Profile Settings Form */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
                {/* Card Title */}
                <div className="text-center mb-8 pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-bold font-tajawal text-slate-900">
                    إعدادات الملف الشخصي
                  </h2>
                </div>

                {isLoadingProfile ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0c2444]" />
                    <span className="text-sm font-medium font-cairo">جاري تحميل بيانات الملف الشخصي...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Row 1: اسم المؤسسة + اسم المسؤول */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo text-right">
                        اسم المؤسسة
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="مؤسسة الأفق التجاري"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo text-right">
                        اسم المسؤول
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="أحمد محمد"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: البريد الإلكتروني + رقم الهاتف */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo text-right">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="info@alufuq.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo text-right">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+966 50 123 4567"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all text-right"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: العنوان */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo text-right">
                      العنوان
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="الرياض، طريق الملك فهد"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all"
                    />
                  </div>

                  {/* Submit Button (Left-aligned in RTL, matching the screenshot) */}
                  <div className="pt-2 flex justify-start">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 bg-[#0c2444] hover:bg-[#07172c] text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-70"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>حفظ التغييرات</span>
                    </button>
                  </div>
                </form>
                )}
              </div>

              {/* Card 2: WhatsApp & Reminder Settings */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
                {/* Header with WhatsApp icon and Connected badge */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-600">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>متصل</span>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <h2 className="text-lg sm:text-xl font-bold font-tajawal text-slate-900">
                      إعدادات واتساب والتذكير
                    </h2>
                    <div className="text-emerald-500">
                      <MessageSquare className="w-6 h-6 stroke-[2.2]" />
                    </div>
                  </div>
                </div>

                {/* Inner Box with Toggle & Template Textarea */}
                <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 space-y-6">
                  {/* Toggle Row */}
                  <div className="flex items-center justify-between">
                    {/* Switch */}
                    <button
                      type="button"
                      onClick={() => {
                        setAutoReminder((prev) => !prev);
                        handleSaveReminderSettings();
                      }}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        autoReminder ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={autoReminder}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          autoReminder ? '-translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Text Label */}
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-slate-800 font-cairo">
                        التذكير التلقائي
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 font-cairo">
                        إرسال رسائل تذكير تلقائية للعملاء قبل موعد السداد
                      </p>
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-800 font-cairo text-right">
                      قالب رسالة التذكير
                    </label>
                    <textarea
                      rows={3}
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      onBlur={handleSaveReminderSettings}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] transition-all font-cairo"
                    />
                    <p className="text-xs text-slate-400 font-cairo text-right">
                      المتغيرات المتاحة: [اسم_العميل]، [المبلغ]، [اسم_المؤسسة]
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section in visual layout (4 cols in desktop): Profile Box, Plan Card, Tabs */}
            <div className="lg:col-span-4 space-y-5 order-1 lg:order-2">
              {/* Box 1: Merchant Profile Card with Avatar & Edit Button */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center justify-between">
                {/* Organization & Manager Info (Right in RTL) */}
                <div className="text-right">
                  <h2 className="text-base font-extrabold font-tajawal text-slate-900 leading-tight">
                    {profile.businessName || 'مؤسسة الأفق التجاري'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium font-cairo mt-1">
                    {profile.fullName || 'أحمد محمد'}
                  </p>
                </div>

                {/* Avatar with Edit Pencil (Left in RTL) */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-slate-100 shadow-xs bg-slate-100">
                    <img
                      src={avatarPreview}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0c2444] text-white rounded-full flex items-center justify-center ring-2 ring-white hover:bg-[#07172c] transition-colors shadow-sm cursor-pointer"
                    title="تغيير الصورة الشخصية"
                    aria-label="تغيير الصورة الشخصية"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Box 2: Current Subscription Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                {/* Plan Title & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-2xs">
                    <Award className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 font-cairo block">
                      الباقة الحالية
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 font-tajawal">
                      باقة الأعمال (نشط)
                    </span>
                  </div>
                </div>

                {/* Renewal & Customers Info - Clean, spaced, and beautiful */}
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100/90 text-xs">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium font-cairo block mb-1">
                      العملاء المتبقين
                    </span>
                    <span className="font-bold text-slate-800 font-cairo text-xs sm:text-sm">
                      غير محدود
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 font-medium font-cairo block mb-1">
                      تاريخ التجديد
                    </span>
                    <span className="font-bold text-slate-800 font-cairo text-xs sm:text-sm">
                      15 أكتوبر 2024
                    </span>
                  </div>
                </div>

                {/* Upgrade Button */}
                <button
                  type="button"
                  onClick={() => navigate(PATHS.SUBSCRIPTIONS)}
                  className="w-full bg-[#183462] hover:bg-[#0c2444] text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors duration-200 shadow-xs cursor-pointer"
                >
                  ترقية الباقة
                </button>
              </div>

              {/* Box 3: Navigation Tabs List */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
                {/* Tab 1: الملف الشخصي */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('profile')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'profile'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'profile' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>الملف الشخصي</span>
                    <User className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 2: إعدادات واتساب */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('whatsapp')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'whatsapp'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'whatsapp' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>إعدادات واتساب</span>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 3: الأمان والوصول */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('security')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'security'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'security' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>الأمان والوصول</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 4: تفضيلات النظام */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('preferences')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'preferences'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'preferences' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>تفضيلات النظام</span>
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
