import type { FC } from 'react';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: FC<HeaderProps> = ({
  onMenuClick,
  searchQuery = '',
  onSearchChange,
}) => {
  return (
    <header
      className="w-full bg-white border-b border-slate-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs"
      dir="rtl"
    >
      {/* Right Side in RTL: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="البحث في العمليات..."
            className="w-full bg-[#f8fafc] border border-slate-200/90 text-slate-800 text-sm rounded-xl pr-10 pl-4 py-2.5 outline-hidden focus:border-[#051838] focus:bg-white transition-all duration-200 placeholder:text-slate-400 font-cairo"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Left Side in RTL: Actions & User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-600 hover:text-[#051838] hover:bg-slate-50 transition-colors duration-200"
          title="التنبيهات"
          aria-label="التنبيهات"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Help Icon */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-600 hover:text-[#051838] hover:bg-slate-50 transition-colors duration-200"
          title="مركز المساعدة"
          aria-label="مركز المساعدة"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pr-1 sm:pr-2 border-r border-slate-100">
          <div className="relative w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden shadow-xs cursor-pointer hover:ring-[#051838]/20 transition-all duration-200">
            <img
              src="/merchant-avatar.jpg"
              alt="صورة التاجر"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
