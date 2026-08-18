import React, { useState } from 'react';
import { 
  Download, 
  Plus, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Search, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  ArrowUpRight, 
  X, 
  Share2, 
  Send,
  Eye
} from 'lucide-react';
import { INITIAL_PAYMENT_LOGS, PaymentTransaction } from '../data/mockReports';
import { ScreenType } from './Header';

interface PaymentLogViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const PaymentLogView: React.FC<PaymentLogViewProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<PaymentTransaction[]>(INITIAL_PAYMENT_LOGS);
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2023-01-01');
  const [endDate, setEndDate] = useState<string>('2023-12-31');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showBottomBanner, setShowBottomBanner] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter logs
  const filteredLogs = logs.filter((item) => {
    const matchMethod = selectedMethod === 'all' || item.paymentMethod === selectedMethod;
    const matchStatus = selectedStatus === 'all' || 
      (selectedStatus === 'verified' && item.statusType === 'verified') ||
      (selectedStatus === 'pending' && item.statusType === 'pending') ||
      (selectedStatus === 'cancelled' && item.statusType === 'cancelled');
    const matchSearch = item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMethod && matchStatus && matchSearch;
  });

  const handleExportData = () => {
    showToast('جاري تجهيز وتصدير سجل المدفوعات بصيغة Excel...');
    setTimeout(() => {
      showToast('تم تصدير ملف البيانات بنجاح!');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
            سجل المدفوعات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            تتبع وإدارة جميع التحصيلات المالية من العملاء بدقة.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Export Data Button */}
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer hover:border-slate-300"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>تصدير البيانات</span>
          </button>

          {/* New Payment Button */}
          <button
            onClick={() => onNavigate('record-payment')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل تحصيل جديد</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Add New Card / Quick Action (Dashed Border) */}
        <div 
          onClick={() => onNavigate('record-payment')}
          className="bg-slate-50/70 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[120px]"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-emerald-500 group-hover:text-emerald-600 flex items-center justify-center text-slate-400 mb-2 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 font-alexandria transition-colors">
            + إضافة بطاقة جديدة
          </span>
        </div>

        {/* Card 2: Pending Confirmations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              عمليات في انتظار التأكيد
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                18
              </span>
            </div>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-2">
              تتطلب مراجعة
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Successfully Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              عمليات تم تحصيلها بنجاح
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                342
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
              عملية مكتملة
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Monthly Collection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              إجمالي التحصيل (الشهري)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-alexandria">
                145,280
              </span>
              <span className="text-xs font-bold text-slate-500">ر.س</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12% من الشهر الماضي</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filters Title & Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>تصفية حسب:</span>
            </div>

            {/* Payment Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="نقداً">نقداً</option>
              <option value="سداد">سداد</option>
              <option value="بطاقة مدى">بطاقة مدى</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="verified">تم التحقق</option>
              <option value="pending">قيد الانتظار</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium w-24 focus:outline-none text-center"
                placeholder="01/01/2023"
              />
            </div>
            
            <span className="text-xs text-slate-400 font-medium">إلى</span>

            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium w-24 focus:outline-none text-center"
                placeholder="31/12/2023"
              />
            </div>

            {(selectedMethod !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedMethod('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                إعادة ضبط
              </button>
            )}
          </div>

        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold text-[11px]">
                <th className="py-3.5 px-4">اسم العميل</th>
                <th className="py-3.5 px-4">المبلغ (ر.س)</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                  
                  {/* Client Info */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${tx.clientAvatarBg}`}>
                        {tx.clientInitial}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 font-alexandria block">
                          {tx.clientName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tx.receiptNo}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-extrabold text-slate-900 font-alexandria text-sm">
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 text-xs">{tx.date}</span>
                      <span className="text-[10px] text-slate-400">{tx.time}</span>
                    </div>
                  </td>

                  {/* Payment Method */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                      {tx.paymentMethod}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {tx.statusType === 'verified' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>تم التحقق</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>قيد الانتظار</span>
                      </span>
                    )}
                  </td>

                  {/* Action 3-dots Menu */}
                  <td className="py-4 px-4 text-center whitespace-nowrap relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === tx.id ? null : tx.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === tx.id && (
                      <div className="absolute left-6 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 text-right animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setSelectedReceipt(tx);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>عرض الإيصال</span>
                        </button>
                        <button
                          onClick={() => {
                            showToast(`تم تنزيل إيصال ${tx.receiptNo} بنجاح!`);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>تحميل الإيصال (PDF)</span>
                        </button>
                        <button
                          onClick={() => {
                            showToast(`تم إرسال نسخة الإيصال للعميل ${tx.clientName} عبر واتساب`);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>إرسال عبر واتساب</span>
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            عرض 3 من أصل 342 عملية تحصيل
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer ${
                currentPage === 1 ? 'bg-[#0b1d3a] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer ${
                currentPage === 2 ? 'bg-[#0b1d3a] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              2
            </button>
            <button
              onClick={() => setCurrentPage(3)}
              className={`w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer ${
                currentPage === 3 ? 'bg-[#0b1d3a] text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              3
            </button>

            <button
              onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
              disabled={currentPage === 3}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING BOTTOM BANNER / NOTIFICATION */}
      {showBottomBanner && (
        <div className="bg-[#0b1d3a] text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold font-alexandria">
                تم التحقق من 4 عمليات اليوم
              </p>
              <p className="text-[10px] sm:text-xs text-slate-300">
                جميع المبالغ تم إيداعها وتحديثها آلياً في أرصدة العملاء.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                showToast('جاري فتح قائمة المهام للمراجعة...');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer font-alexandria"
            >
              تحتاج إلى مراجعة 12 مهمة
            </button>
            <button
              onClick={() => setShowBottomBanner(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-right border border-slate-100 animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 font-alexandria">إيصال استلام دفعة</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الإيصال:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900 font-alexandria">{selectedReceipt.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاريخ وساعة السداد:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.date} - {selectedReceipt.time}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="text-slate-700 font-bold">المبلغ المسدد:</span>
                <span className="text-lg font-extrabold text-emerald-600 font-alexandria">
                  {selectedReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  showToast('تم تحميل الإيصال بصيغة PDF');
                  setSelectedReceipt(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                تحميل PDF
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
