import { useState } from 'react';
import type { FC } from 'react';
import { Bell, Check, ChevronLeft } from 'lucide-react';

interface PaymentItem {
  id: string;
  customerName: string;
  amount: string;
  dueDate: string;
}

const INITIAL_PAYMENTS: PaymentItem[] = [
  {
    id: '1',
    customerName: 'عبدالله محمد',
    amount: '١٥,٠٠٠',
    dueDate: '١٠ أكتوبر ٢٠٢٣',
  },
  {
    id: '2',
    customerName: 'سارة أحمد',
    amount: '٨,٥٠٠',
    dueDate: '١٢ أكتوبر ٢٠٢٣',
  },
  {
    id: '3',
    customerName: 'خالد علي',
    amount: '٢٢,٣٠٠',
    dueDate: '١٣ أكتوبر ٢٠٢٣',
  },
];

interface OverduePaymentsTableProps {
  searchQuery?: string;
}

export const OverduePaymentsTable: FC<OverduePaymentsTableProps> = ({ searchQuery = '' }) => {
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});

  const handleSendReminder = (id: string) => {
    setRemindedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setRemindedIds((prev) => ({ ...prev, [id]: false }));
    }, 2500);
  };

  const filteredPayments = INITIAL_PAYMENTS.filter((payment) =>
    payment.customerName.includes(searchQuery.trim())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between" dir="rtl">
      <div>
        {/* Table Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold font-tajawal text-slate-900">
            المدفوعات المتأخرة
          </h2>
          <button
            type="button"
            className="text-sm font-semibold text-slate-600 hover:text-[#051838] flex items-center gap-1 transition-colors duration-150"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="pb-3 pr-2 font-medium">اسم العميل</th>
                <th className="pb-3 text-center font-medium">المبلغ (ر.س)</th>
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
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    {/* Customer Name */}
                    <td className="py-4 pr-2 font-bold font-tajawal text-sm text-slate-800">
                      {payment.customerName}
                    </td>

                    {/* Amount */}
                    <td className="py-4 text-center font-bold font-tajawal text-sm text-[#e11d48]">
                      {payment.amount}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 text-center text-sm font-medium text-slate-600 font-tajawal">
                      {payment.dueDate}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 pl-2 text-left">
                      <button
                        type="button"
                        onClick={() => handleSendReminder(payment.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-tajawal border transition-all duration-200 shadow-2xs ${
                          isSent
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تم الإرسال</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-slate-600" />
                            <span>تذكير</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                    لا توجد مدفوعات متطابقة مع البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
