import { useState, type FC } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Hash,
  Coins,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { ApiError } from '../../api/httpClient';
import { createSaleFromDeposit } from '../../services/mizanService';

export interface DepositSaleCandidate {
  id: string;
  bankAmount: number;
  bankSenderName: string;
  bankReferenceNumber: string;
  transactionDate: string;
}

export interface CreateSaleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: DepositSaleCandidate | null;
  onSuccess: (message: string) => void;
  onRefreshData?: () => void;
}

export const CreateSaleConfirmModal: FC<CreateSaleConfirmModalProps> = ({
  isOpen,
  onClose,
  deposit,
  onSuccess,
  onRefreshData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    type: 'error' | 'warning';
  } | null>(null);

  if (!isOpen || !deposit) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorDetails(null);

    try {
      // POST /api/mizan/transactions/{transactionId}/create-sale with NO REQUEST BODY
      const result = await createSaleFromDeposit(deposit.id);

      const successMsg =
        result?.message || 'تم إنشاء المبيعة الفورية للإيداع بنجاح واعتماد المطابقة نهائياً.';
      onSuccess(successMsg);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setErrorDetails({
            message: 'لم يتم العثور على المعاملة البنكية المطلوبة (Transaction not found).',
            type: 'error',
          });
        } else if (err.status === 400) {
          const bodyMsg =
            (err.body as { message?: string })?.message ||
            'يمكن فقط تحويل الإيداعات غير المخصصة أو التي بدون فاتورة إلى مبيعات فورية.';
          setErrorDetails({
            message: bodyMsg,
            type: 'error',
          });
        } else if (err.status === 409) {
          setErrorDetails({
            message:
              'تنبيه تعارض (409): تم إنشاء مبيعة لهذا الإيداع مسبقاً أو أن المعاملة معتمدة بالفعل. جاري تحديث البيانات...',
            type: 'warning',
          });
          if (onRefreshData) {
            onRefreshData();
          }
        } else {
          setErrorDetails({
            message:
              (err.body as { message?: string })?.message ||
              'حدث خطأ أثناء معالجة الطلب في الخادم. يرجى المحاولة لاحقاً.',
            type: 'error',
          });
        }
      } else {
        setErrorDetails({
          message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-emerald-50/50 via-white to-slate-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                تأكيد إنشاء مبيعة فورية من الإيداع
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نظام ميزان — ربط الإيداع البنكي تلقائياً بفاتورة مبيعات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Explanation Alert */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              سيقوم النظام آلياً بإنشاء فاتورة مبيعة فورية وربطها بهذا الإيداع البنكي
              وتسجيل طريقة الدفع كـ <strong>حوالة بنكية</strong> واعتماد المطابقة نهائياً
              دون الحاجة لإدخال أي بيانات يدوياً.
            </div>
          </div>

          {/* Deposit Visual Details Card (NO Form Inputs!) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>مبلغ الإيداع البنكي:</span>
              </div>
              <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 font-mono">
                {deposit.bankAmount.toLocaleString()} ₪
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>اسم المودع / المحول:</span>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {deposit.bankSenderName || 'إيداع غير محدد (Unknown Deposit)'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Hash className="w-4 h-4 text-purple-500" />
                <span>رقم الحوالة المرجعي:</span>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                {deposit.bankReferenceNumber || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>تاريخ وتوقيت المعاملة:</span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {deposit.transactionDate}
              </span>
            </div>
          </div>

          {/* Error / Conflict Alert if occurred */}
          {errorDetails && (
            <div
              className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
                errorDetails.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {errorDetails.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{errorDetails.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold transition-all"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء المبيعة والاعتماد...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد إنشاء المبيعة الفورية</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
