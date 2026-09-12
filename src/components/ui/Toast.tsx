import type { FC } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
}

/**
 * Automatically detects the semantic type of a message based on Arabic keywords
 * so that existing showToast('message') calls receive the correct icon and coloring.
 */
export function detectToastType(msg: string): ToastType {
  const lower = msg.toLowerCase();
  if (
    lower.includes('لا يمكن') ||
    lower.includes('تعذر') ||
    lower.includes('فشل') ||
    lower.includes('خطأ') ||
    lower.includes('يوجد عميل') ||
    lower.includes('مطلوب') ||
    lower.includes('غير صحيح') ||
    lower.includes('لا يوجد') ||
    lower.includes('غير صالح') ||
    lower.includes('انتهت') ||
    lower.includes('مرفوض')
  ) {
    return 'error';
  }
  if (
    lower.includes('تحذير') ||
    lower.includes('تنبيه') ||
    lower.includes('غير مدعوم') ||
    lower.includes('ستتوفر') ||
    lower.includes('قريباً') ||
    lower.includes('لاحظ')
  ) {
    return 'warning';
  }
  return 'success';
}

export const Toast: FC<ToastProps> = ({ message, type, onClose }) => {
  if (!message) return null;

  const resolvedType = type || detectToastType(message);

  const configs = {
    error: {
      border: 'border-rose-500/30',
      shadow: 'shadow-rose-950/20',
      iconBox: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      tagText: 'text-rose-400',
      tag: 'تعذر التنفيذ',
      icon: AlertCircle,
    },
    warning: {
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-950/20',
      iconBox: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      tagText: 'text-amber-400',
      tag: 'تنبيه',
      icon: AlertTriangle,
    },
    success: {
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-950/20',
      iconBox: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      tagText: 'text-emerald-400',
      tag: 'تمت العملية بنجاح',
      icon: CheckCircle2,
    },
    info: {
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-950/20',
      iconBox: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      tagText: 'text-blue-400',
      tag: 'معلومة',
      icon: Info,
    },
  };

  const config = configs[resolvedType];
  const IconComponent = config.icon;

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[calc(100%-2rem)] sm:w-auto animate-toast-in print:hidden pointer-events-auto"
      dir="rtl"
      role="alert"
    >
      <div
        className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#0c2444]/95 text-white backdrop-blur-xl border ${config.border} shadow-2xl ${config.shadow}`}
      >
        {/* Semantic Icon Box */}
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${config.iconBox}`}
        >
          <IconComponent className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0 flex-1 pr-1">
          <span className={`text-[11px] font-bold font-cairo leading-none mb-1 ${config.tagText}`}>
            {config.tag}
          </span>
          <p className="text-sm font-medium font-cairo text-slate-100 leading-snug">
            {message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
