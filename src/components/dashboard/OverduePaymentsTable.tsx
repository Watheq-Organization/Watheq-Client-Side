import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { getOverduePayments, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import { sendDebtReminder, toSendReminderErrorMessage } from '../../services/debtService';
import type { OverduePaymentItem } from '../../types/dashboard';
import { Toast } from '../ui/Toast';

interface OverduePaymentsTableProps {
  searchQuery?: string;
}

export const OverduePaymentsTable: FC<OverduePaymentsTableProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<OverduePaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** debtId → permanently sent (success) */
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  /** debtId → currently sending (in-flight) */
  const [sendingIds, setSendingIds] = useState<Record<string, boolean>>({});
  /** Toast notification */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getOverduePayments()
      .then((data) => {
        setPayments(data);
      })
      .catch((err) => {
        setError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Calls POST /api/Debt/{debtId}/send-reminder.
   * Uses payment.id which equals the debtId from the overdue debts report.
   */
  const handleSendReminder = async (debtId: string) => {
    if (sendingIds[debtId] || remindedIds[debtId]) return;

    setSendingIds((prev) => ({ ...prev, [debtId]: true }));
    try {
      await sendDebtReminder(debtId);
      setRemindedIds((prev) => ({ ...prev, [debtId]: true }));
      showToast('تم إرسال التذكير للعميل عبر تيليجرام بنجاح ✓', 'success');
    } catch (err) {
      showToast(toSendReminderErrorMessage(err), 'error');
    } finally {
      setSendingIds((prev) => ({ ...prev, [debtId]: false }));
    }
  };

  const filteredPayments = payments
    .filter((payment) =>
      payment.customerName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .reverse();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 flex flex-col justify-between" dir="rtl">
      <div>
        {/* Table Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
            الديون المتأخرة
          </h2>
          <button
            type="button"
            onClick={() => navigate(PATHS.CUSTOMERS)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#051838] dark:text-white flex items-center gap-1 transition-colors duration-150 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="underline text-xs font-bold cursor-pointer hover:no-underline"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0f284e]" />
              <span className="text-xs font-medium font-cairo">جاري تحميل المدفوعات المتأخرة...</span>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="pb-3 pr-2 font-medium">اسم العميل</th>
                  <th className="pb-3 text-center font-medium">المبلغ (<span className="text-lg font-bold font-sans">₪</span>)</th>
                  <th className="pb-3 text-center font-medium">تاريخ الاستحقاق</th>
                  <th className="pb-3 pl-2 text-left font-medium">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map((payment) => {
                  const isSent = !!remindedIds[payment.id];

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50/6 dark:hover:bg-slate-700/60 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/customers/${payment.customerId}`)}
                    >
                      {/* Customer Name */}
                      <td className="py-4 pr-2 font-bold font-cairo text-sm text-slate-800 dark:text-slate-200 hover:text-[#0c2444] dark:text-blue-400 transition-colors duration-150 underline-offset-2 hover:underline">
                        {payment.customerName}
                      </td>

                      {/* Amount */}
                      <td className="py-4 text-center font-bold font-cairo text-sm text-[#e11d48]">
                        {payment.amount}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400 font-cairo">
                        {payment.dueDate}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 pl-2 text-left">
                        {(() => {
                          const isSending = !!sendingIds[payment.id];
                          const isDisabled = isSent || isSending;
                          return (
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleSendReminder(payment.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-cairo border transition-all duration-200 shadow-2xs ${isSent
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default'
                                  : isSending
                                    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400 cursor-wait'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 active:scale-95 cursor-pointer'
                                }`}
                            >
                              {isSent ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>تم الإرسال</span>
                                </>
                              ) : isSending ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                                  <span>جاري الإرسال...</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                  <span>تذكير</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                      {searchQuery.trim() ? 'لا توجد مدفوعات متطابقة مع البحث' : 'لا توجد مدفوعات متأخرة حالياً في قاعدة البيانات'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

