import { useCallback, useEffect, useState, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  RotateCw,
} from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { getOverduePayments, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import { sendDebtReminder, toSendReminderErrorMessage } from '../../services/debtService';
import type { OverduePaymentItem } from '../../types/dashboard';
import { getCurrencyConfig } from '../../utils/currency';
import { Toast } from '../ui/Toast';

interface OverduePaymentsTableProps {
  searchQuery?: string;
  refreshTrigger?: number;
}

const INITIAL_VISIBLE_ROWS = 6;

function formatDaysOverdueLabel(days?: number): string | null {
  if (!days || days <= 0) return null;
  if (days === 1) return 'متأخر يوم واحد';
  if (days === 2) return 'متأخر يومين';
  if (days >= 3 && days <= 10) return `متأخر ${days} أيام`;
  return `متأخر ${days} يوماً`;
}

export const OverduePaymentsTable: FC<OverduePaymentsTableProps> = ({
  searchQuery = '',
  refreshTrigger = 0,
}) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<OverduePaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  /** debtId → permanently sent (success) */
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  /** debtId → currently sending (in-flight) */
  const [sendingIds, setSendingIds] = useState<Record<string, boolean>>({});
  /** Toast notification */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchData = useCallback((isMountedCheck?: () => boolean) => {
    getOverduePayments()
      .then((data) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setPayments(data);
        setError(null);
      })
      .catch((err) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        if (isMountedCheck && !isMountedCheck()) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchData(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchData, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchData();
  };

  /** Calls POST /api/Debt/{customerId}/send-reminder. */
  const handleSendReminder = async (payment: OverduePaymentItem) => {
    const targetCustomerId = payment.customerId || payment.id;
    const key = payment.id;
    if (sendingIds[key] || remindedIds[key]) return;

    setSendingIds((prev) => ({ ...prev, [key]: true }));
    try {
      await sendDebtReminder(targetCustomerId);
      setRemindedIds((prev) => ({ ...prev, [key]: true }));
      showToast('تم إرسال التذكير للعميل عبر تيليجرام بنجاح', 'success');
    } catch (err) {
      showToast(toSendReminderErrorMessage(err), 'error');
    } finally {
      setSendingIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? payments.filter(
          (payment) =>
            payment.customerName.toLowerCase().includes(q) ||
            (payment.phone && payment.phone.toLowerCase().includes(q))
        )
      : payments;
    return [...list].reverse();
  }, [payments, searchQuery]);

  const visiblePayments = isExpanded
    ? filteredPayments
    : filteredPayments.slice(0, INITIAL_VISIBLE_ROWS);

  const hasMoreRows = filteredPayments.length > INITIAL_VISIBLE_ROWS;

  return (
    <div
      className="rounded-xl border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-xs overflow-hidden flex flex-col"
      dir="rtl"
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold font-cairo text-[#09152B] dark:text-white">
              الذمم المتأخرة
            </h2>
            {!isLoading && filteredPayments.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-extrabold tabular-nums font-jakarta">
                {filteredPayments.length}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
            حسابات تجاوزت موعد الاستحقاق المحدد للسداد
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(PATHS.CUSTOMERS)}
          className="text-xs font-bold text-[#09152B] dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          <span>دليل العملاء</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 underline text-xs font-bold cursor-pointer hover:no-underline shrink-0"
          >
            <RotateCw className="w-3 h-3" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Table / Loading / Empty Body */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div key={idx} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-3.5 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse hidden sm:block" />
                <div className="h-4 w-16 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
              {searchQuery.trim() ? (
                <Search className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo">
              {searchQuery.trim()
                ? 'لا توجد نتائج مطابقة للبحث'
                : 'لا توجد ذمم متأخرة عن السداد'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {searchQuery.trim()
                ? 'جرّب البحث باسم مختلف أو برقم هاتف العميل.'
                : 'جميع حسابات العملاء حالياً ضمن مواعيد الاستحقاق المحددة.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                <th className="py-3 pr-5 pl-3 font-bold">العميل</th>
                <th className="py-3 px-3 font-bold">تاريخ الاستحقاق</th>
                <th className="py-3 px-3 font-bold">المبلغ المستحق</th>
                <th className="py-3 pl-5 pr-3 text-left font-bold">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {visiblePayments.map((payment) => {
                const isSent = !!remindedIds[payment.id];
                const isSending = !!sendingIds[payment.id];
                const isDisabled = isSent || isSending;
                const currencyCfg = getCurrencyConfig(payment.currencyCode);
                const overdueLabel = formatDaysOverdueLabel(payment.daysOverdue);
                const initial = payment.customerName?.trim()?.charAt(0) || 'ع';

                return (
                  <tr
                    key={payment.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/customers/${payment.customerId}`)}
                  >
                    {/* Customer Name + Phone */}
                    <td className="py-3.5 pr-5 pl-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#09152B] dark:text-slate-100 text-sm font-extrabold flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold font-cairo text-sm text-[#09152B] dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                            {payment.customerName}
                          </div>
                          {payment.phone && (
                            <div
                              className="text-xs font-medium text-slate-600 dark:text-slate-400 font-jakarta tabular-nums inline-block mt-0.5"
                              dir="ltr"
                            >
                              {payment.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Due Date + Overdue Elapsed */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div
                        className="text-[13px] font-bold text-[#09152B] dark:text-slate-100 font-jakarta tabular-nums inline-block"
                        dir="ltr"
                      >
                        {payment.dueDate}
                      </div>
                      {overdueLabel && (
                        <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-0.5 tabular-nums">
                          {overdueLabel}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-baseline gap-1 font-jakarta tabular-nums font-extrabold text-[15px] text-rose-700 dark:text-rose-400"
                        dir="ltr"
                      >
                        <span>{payment.amount}</span>
                        <span className="text-xs font-bold opacity-90">{currencyCfg.symbol}</span>
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 pl-5 pr-3 text-left whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSendReminder(payment);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-cairo border transition-colors ${
                          isSent
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 cursor-default'
                            : isSending
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-wait'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-[#09152B] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 shadow-2xs cursor-pointer'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>تم الإرسال</span>
                          </>
                        ) : isSending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                            <span>جاري الإرسال...</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                            <span>تذكير</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expand / Collapse Footer */}
      {!isLoading && hasMoreRows && (
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#09152B] dark:hover:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors tabular-nums"
          >
            <span>
              {isExpanded
                ? 'عرض أقل'
                : `عرض جميع الذمم المتأخرة (${filteredPayments.length})`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
