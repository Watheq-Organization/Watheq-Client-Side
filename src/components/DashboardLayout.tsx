import React, { useState } from 'react';
import { ScreenType } from './Header';
import wathiqLogoIcon from '../assets/wathiq_logo_icon.jpg';
import { logoutUser } from '../services/auth';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  BellRing, 
  CreditCard, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  X,
  User,
  Shield
} from 'lucide-react';

interface DashboardLayoutProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentScreen,
  onNavigate,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'clients', label: 'العملاء', icon: Users },
    { id: 'payment-log', label: 'سجل المدفوعات', icon: CreditCard },
    { id: 'add-debt', label: 'إضافة دين', icon: PlusCircle },
    { id: 'reports', label: 'التقارير المالية', icon: FileText },
    { id: 'reminders', label: 'الأتمتة والتنبيهات', icon: BellRing },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 font-sans flex flex-row-reverse overflow-x-hidden text-right" dir="rtl">
      
      {/* SIDEBAR (Right side in RTL) */}
      <aside 
        className={`fixed top-0 bottom-0 right-0 z-50 w-64 bg-[#0b1d3a] text-white flex flex-col justify-between transition-transform duration-300 shadow-xl ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Logo Section */}
        <div>
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <div 
              onClick={() => onNavigate('splash')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-slate-600/40 p-0.5 bg-white">
                <img src={wathiqLogoIcon} alt="وثق" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl font-alexandria tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  وثق
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1">
                  إدارة الديون والتوثيق
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as ScreenType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30' 
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Links */}
        <div className="p-4 border-t border-slate-700/50 space-y-1">
          <button
            onClick={() => {
              onNavigate('settings');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              currentScreen === 'settings' 
                ? 'bg-emerald-600/90 text-white shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>الإعدادات</span>
          </button>

          <button
            onClick={() => {
              setIsLogoutModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64 transition-all">
        
        {/* TOP BAR HEADER */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          
          {/* Right Side in RTL: Mobile menu toggle & Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث في العمليات..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Left Side in RTL: Notifications & User Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Notifications Button & Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h4 className="font-bold text-sm text-slate-900 font-alexandria">التنبيهات</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">3 جديدة</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                      <p className="font-semibold text-slate-800">تم استلام دفعة من عبدالله محمد</p>
                      <span className="text-[10px] text-slate-400">منذ 15 دقيقة</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                      <p className="font-semibold text-slate-800">تذكير سداد دين متأخر لسارة أحمد</p>
                      <span className="text-[10px] text-slate-400">منذ 2 ساعة</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  أ
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 font-alexandria">أحمد محمد</span>
                  <span className="text-[10px] text-slate-500 font-medium">مؤسسة الأفق التجاري</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 font-alexandria">أحمد محمد</p>
                    <p className="text-[11px] text-slate-500">info@alufoq.com</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>إعدادات الحساب</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>الأمان والخصوصية</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setIsLogoutModalOpen(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
        
      </div>

      {/* ======================================================== */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-7 text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Top Rose Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <LogOut className="w-7 h-7 text-rose-600 rotate-180" />
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-slate-900 font-alexandria mb-2">
              تسجيل الخروج
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              هل أنت متأكد من تسجيل الخروج؟ ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم.
            </p>

            {/* Action Buttons: Confirm Red + Cancel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setIsLogoutModalOpen(false);
                  onNavigate('login');
                }}
                className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs cursor-pointer font-alexandria"
              >
                تسجيل الخروج
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors text-xs cursor-pointer"
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
