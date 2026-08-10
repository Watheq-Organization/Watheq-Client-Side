import React, { useState } from 'react';
import { ScreenType } from './Header';
import { 
  ArrowRight, 
  RefreshCw, 
  Download, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  PlusCircle, 
  FileText, 
  AlertCircle, 
  Clock, 
  CreditCard,
  ShieldCheck,
  X
} from 'lucide-react';

interface ClientDetailViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ onNavigate }) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'debts' | 'payments'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Debt Form
  const [debtInvoiceNum, setDebtInvoiceNum] = useState('#8825');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDesc, setDebtDesc] = useState('');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');

  const [currentBalance, setCurrentBalance] = useState(4250.00);

  const [transactions, setTransactions] = useState([
    {
      id: 't1',
      type: 'debt',
      title: 'إضافة دين جديد - فاتورة #8821',
      amount: '+1,250.00',
      amountColor: 'text-rose-600',
      desc: 'شراء مستلزمات مكتبية وأدوات قرطاسية متنوعة.',
      date: '14 مارس 2024 - 04:30 م',
      status: 'غير مدفوع',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 't2',
      type: 'payment',
      title: 'استلام دفعة نقدية',
      amount: '-500.00',
      amountColor: 'text-emerald-600',
      desc: 'سداد جزئي مقابل مديونية شهر فبراير.',
      date: '02 مارس 2024 - 11:15 ص',
      status: 'مؤكدة',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 't3',
      type: 'alert',
      title: 'تنبيه آلي: تأخر سداد',
      amount: '',
      amountColor: '',
      desc: 'لقد تجاوز العميل موعد السداد المحدد للفاتورة #8122.',
      date: '01 فبراير 2024',
      status: '',
      badgeColor: ''
    }
  ]);

  const handleAddDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtAmount) return;

    const added = Number(debtAmount);
    setCurrentBalance((prev) => prev + added);

    const newTx = {
      id: `t${Date.now()}`,
      type: 'debt',
      title: `إضافة دين جديد - فاتورة ${debtInvoiceNum}`,
      amount: `+${added.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      amountColor: 'text-rose-600',
      desc: debtDesc || 'إضافة دين جديد على الحساب.',
      date: 'الآن',
      status: 'غير مدفوع',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    };

    setTransactions([newTx, ...transactions]);
    setIsAddDebtOpen(false);
    setDebtAmount('');
    setDebtDesc('');
    setToastMsg(`تم إضافة دين جديد بقيمة ${added.toLocaleString()} ر.س على حساب العميل!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;

    const paid = Number(paymentAmount);
    setCurrentBalance((prev) => Math.max(0, prev - paid));

    const newTx = {
      id: `t${Date.now()}`,
      type: 'payment',
      title: 'استلام دفعة نقدية',
      amount: `-${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      amountColor: 'text-emerald-600',
      desc: paymentDesc || 'دفعة نقدية مسددة لحساب المديونية.',
      date: 'الآن',
      status: 'مؤكدة',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    setTransactions([newTx, ...transactions]);
    setIsRecordPaymentOpen(false);
    setPaymentAmount('');
    setPaymentDesc('');
    setToastMsg(`تم تسجيل دفعة نقدية بقيمة ${paid.toLocaleString()} ر.س بنجاح!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeLedgerTab === 'all') return true;
    if (activeLedgerTab === 'debts') return tx.type === 'debt';
    if (activeLedgerTab === 'payments') return tx.type === 'payment';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Alert Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('clients')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="العودة لقائمة العملاء"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
              ملف العميل
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              عرض وإدارة سجل المديونية الخاص بالعميل.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <span>تحميل السجل</span>
          </button>

          <button 
            onClick={() => {
              setToastMsg('تم تحديث بيانات وسجل العميل بنجاح!');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="bg-[#0b1d3a] hover:bg-[#0f2a54] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN IN RTL (4 cols): Client Info & Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Client Details Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col items-center text-center">
            
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white font-bold text-3xl flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
                  alt="أحمد الراجحي"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-alexandria">
              أحمد الراجحي
            </h3>
            
            <div className="mt-1 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600">
              <span>هوية: 1029384756</span>
            </div>

            <div className="w-full border-t border-slate-100 my-4 pt-4 space-y-2.5 text-xs text-slate-600 text-right">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-4 h-4" />
                  رقم الهاتف:
                </span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">+966 50 123 4567</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  تاريخ التسجيل:
                </span>
                <span className="font-bold text-slate-800">12 أكتوبر 2023</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                  حالة الائتمان:
                </span>
                <span className="font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px]">
                  موثوق
                </span>
              </div>
            </div>

            {/* Dark Current Debt Summary Card */}
            <div className="w-full bg-[#0b1d3a] text-white rounded-2xl p-5 text-right shadow-md relative overflow-hidden my-2">
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                إجمالي المديونية الحالية
              </span>

              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-extrabold font-alexandria tracking-tight">
                  {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-300">ر.س</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300">
                <div>
                  <span className="block text-slate-400">آخر دفعة:</span>
                  <span className="font-bold text-white">500.00 ر.س</span>
                </div>
                <div>
                  <span className="block text-slate-400">تاريخ الاستحقاق:</span>
                  <span className="font-bold text-white">25 مارس 2024</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Stack */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                onClick={() => setIsRecordPaymentOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل دفعة جديدة</span>
              </button>

              <button
                onClick={() => setIsAddDebtOpen(true)}
                className="w-full bg-[#0b1d3a] hover:bg-[#0f2a54] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دين جديد</span>
              </button>

              <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>تصدير كشف حساب (PDF)</span>
              </button>
            </div>

          </div>

        </div>

        {/* LEFT COLUMN IN RTL (8 cols): Financial Activity Ledger */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          
          {/* Ledger Title & Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 font-alexandria">
              سجل النشاط المالي
            </h2>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveLedgerTab('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLedgerTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل
              </button>

              <button
                onClick={() => setActiveLedgerTab('debts')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLedgerTab === 'debts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الديون
              </button>

              <button
                onClick={() => setActiveLedgerTab('payments')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLedgerTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المدفوعات
              </button>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="space-y-4">
            {filteredTransactions.map((tx) => {
              if (tx.type === 'alert') {
                return (
                  <div key={tx.id} className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 flex items-start gap-4 text-right">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-blue-900 font-alexandria">{tx.title}</h4>
                      <p className="text-xs text-blue-700 mt-1 font-medium">{tx.desc}</p>
                      <span className="text-[10px] text-blue-500 font-semibold block mt-2">{tx.date}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={tx.id} className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all text-right">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'debt' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {tx.type === 'debt' ? <Plus className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 font-alexandria">{tx.title}</h4>
                        {tx.status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tx.badgeColor}`}>
                            {tx.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{tx.desc}</p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{tx.date}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span className={`text-lg font-extrabold block ${tx.amountColor}`}>
                      {tx.amount}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">ريال سعودي</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 font-medium">
              يتم تحديث السجل تلقائياً عند كل عملية إضافة أو سداد مؤكدة.
            </span>
          </div>

        </div>

      </div>

      {/* MODAL 1: ADD DEBT DIALOG */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">إضافة دين جديد للعميل</h3>
              <button onClick={() => setIsAddDebtOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة / المرجعي</label>
                <input
                  type="text"
                  required
                  value={debtInvoiceNum}
                  onChange={(e) => setDebtInvoiceNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ الدين (ر.س)</label>
                <input
                  type="number"
                  required
                  placeholder="1250.00"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بيان العملية / الوصف</label>
                <textarea
                  rows={3}
                  placeholder="مثال: توريد شحنة أدوات مكتبية..."
                  value={debtDesc}
                  onChange={(e) => setDebtDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#0b1d3a] hover:bg-[#0f2a54] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  حفظ إضافة الدين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT DIALOG */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">تسجيل دفعة جديدة</h3>
              <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المسدد (ر.س)</label>
                <input
                  type="number"
                  required
                  placeholder="500.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد / ملاحظات</label>
                <textarea
                  rows={3}
                  placeholder="مثال: تحويل بنكي / نقداً..."
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  تأكيد تسديد الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
