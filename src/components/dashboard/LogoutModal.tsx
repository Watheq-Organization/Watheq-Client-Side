import type { FC } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const LogoutModal: FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      dir="rtl"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95"
      >
        {/* Top Icon Box */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
          <LogOut className="w-7 h-7" />
        </div>

        {/* Modal Heading */}
        <h3 className="text-xl font-bold font-tajawal text-slate-900 mb-2">
          تسجيل الخروج
        </h3>

        {/* Modal Subtitle / Description */}
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-cairo">
          هل أنت متأكد من تسجيل الخروج؟ ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم
        </p>

        {/* Action Buttons (RTL: Logout button on the right, Cancel button on the left) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#fecaca] hover:bg-[#fca5a5] text-[#b91c1c] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'جاري الخروج...' : 'تسجيل الخروج'}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
