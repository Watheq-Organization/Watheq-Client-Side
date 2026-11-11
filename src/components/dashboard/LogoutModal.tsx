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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200"
      dir="rtl"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center"
      >
        {/* Icon */}
        <div className="w-11 h-11 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <LogOut className="w-5 h-5" />
        </div>

        {/* Modal Heading */}
        <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white mb-1.5">
          تسجيل الخروج
        </h3>

        {/* Modal Description */}
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-cairo">
          هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full h-10 px-4 rounded-lg text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'جاري الخروج...' : 'تأكيد الخروج'}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full h-10 px-4 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
