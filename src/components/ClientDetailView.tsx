import React, { useState, useEffect } from 'react';
import { ScreenType } from './Header';
import { Client, ClientTransaction } from '../types/client';
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
  X,
  Building,
  User,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ClientDetailViewProps {
  onNavigate: (screen: ScreenType) => void;
  client?: Client;
  onUpdateClient?: (updatedClient: Client) => void;
  onDeleteClient?: (clientId: string) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ 
  onNavigate, 
  client,
  onUpdateClient,
  onDeleteClient
}) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'debts' | 'payments'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Debt Form
  const [debtInvoiceNum, setDebtInvoiceNum] = useState('#8825');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDesc, setDebtDesc] = useState('');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');

  // Fallback default client if none provided
  const currentClientName = client?.name || 'أحمد عبدالله الراجحي';
  const currentClientIdNum = client?.idNum || '1029384756';
  const currentClientPhone = client?.phone || '+966 50 123 4567';
  const currentClientType = client?.type || 'عميل أفراد';
  const currentClientRegistered = client?.registeredDate || '12 أكتوبر 2023';
  const currentClientCreditStatus = client?.creditStatus || (client?.status === 'overdue' ? 'متعثر جزئياً' : client?.status === 'paid' ? 'ممتاز' : 'موثوق');
  const currentClientLastPayment = client?.lastPayment || '500.00 ر.س';
  const currentClientDueDate = client?.dueDate || (client?.status === 'paid' ? 'لا يوجد' : '25 مارس 2024');

  const initialDebtNum = client?.debt 
    ? parseFloat(String(client.debt).replace(/,/g, '')) || 0 
    : 45000;

  const [currentBalance, setCurrentBalance] = useState(initialDebtNum);
  const [transactions, setTransactions] = useState<ClientTransaction[]>(
    client?.transactions && client.transactions.length > 0 
      ? client.transactions 
      : [
          {
            id: 't1',
            type: 'debt',
            title: `إضافة دين جديد - فاتورة #8821`,
            amount: `+${initialDebtNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            amountColor: 'text-rose-600',
            desc: 'رصيد مديونية مسجل على حساب العميل.',
            date: '14 مارس 2024 - 04:30 م',
            status: initialDebtNum > 0 ? 'غير مدفوع' : 'تم السداد',
            badgeColor: initialDebtNum > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }
        ]
  );

  // Sync state when selected client changes
  useEffect(() => {
    if (client) {
      const debtVal = parseFloat(String(client.debt).replace(/,/g, '')) || 0;
      setCurrentBalance(debtVal);
      if (client.transactions && client.transactions.length > 0) {
        setTransactions(client.transactions);
      } else {
        setTransactions([
          {
            id: `t-${client.id}-1`,
            type: 'debt',
            title: `إضافة دين جديد - فاتورة #8821`,
            amount: `+${debtVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            amountColor: 'text-rose-600',
            desc: 'رصيد مديونية مسجل على حساب العميل.',
            date: '14 مارس 2024 - 04:30 م',
            status: debtVal > 0 ? 'غير مدفوع' : 'تم السداد',
            badgeColor: debtVal > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }
        ]);
      }
    }
  }, [client]);

  const handleAddDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtAmount) return;

    const added = Number(debtAmount);
    const newBalance = currentBalance + added;
    setCurrentBalance(newBalance);

    const newTx: ClientTransaction = {
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

    const updatedTxList = [newTx, ...transactions];
    setTransactions(updatedTxList);

    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        debt: newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        status: newBalance > 0 ? 'active' : 'paid',
        statusText: newBalance > 0 ? 'دين نشط' : 'تم السداد',
        statusColor: newBalance > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        transactions: updatedTxList
      });
    }

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
    const newBalance = Math.max(0, currentBalance - paid);
    setCurrentBalance(newBalance);

    const newTx: ClientTransaction = {
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

    const updatedTxList = [newTx, ...transactions];
    setTransactions(updatedTxList);

    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        debt: newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        lastPayment: `${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س`,
        status: newBalance > 0 ? client.status : 'paid',
        statusText: newBalance > 0 ? client.statusText : 'تم السداد',
        statusColor: newBalance > 0 ? client.statusColor : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        transactions: updatedTxList
      });
    }

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
                ملف العميل: {currentClientName}
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${client?.statusColor || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {client?.statusText || 'نشط'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              عرض وإدارة سجل المديونية الخاص بالعميل وتحديث كشف الحساب.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setToastMsg('جاري تصدير كشف الحساب بصيغة PDF...');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
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

          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2 hover:border-rose-300"
            title="حذف العميل"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>حذف العميل</span>
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
              <div className={`w-24 h-24 rounded-2xl ${client?.avatarColor || 'bg-slate-900 text-white'} font-bold text-3xl flex items-center justify-center shadow-lg border-4 border-white overflow-hidden`}>
                {client?.avatarUrl ? (
                  <img
                    src={client.avatarUrl}
                    alt={currentClientName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{client?.initial || currentClientName.charAt(0)}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-alexandria">
              {currentClientName}
            </h3>
            
            <div className="mt-1 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600">
              <span>هوية / سجل: {currentClientIdNum}</span>
            </div>

            <div className="w-full border-t border-slate-100 my-4 pt-4 space-y-2.5 text-xs text-slate-600 text-right">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <User className="w-4 h-4" />
                  نوع العميل:
                </span>
                <span className="font-bold text-slate-800">{currentClientType}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-4 h-4" />
                  رقم الهاتف:
                </span>
                <span className="font-bold text-slate-800 font-mono" dir="ltr">{currentClientPhone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  تاريخ التسجيل:
                </span>
                <span className="font-bold text-slate-800">{currentClientRegistered}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                  حالة الائتمان:
                </span>
                <span className="font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px]">
                  {currentClientCreditStatus}
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
                  <span className="font-bold text-white">{currentClientLastPayment}</span>
                </div>
                <div>
                  <span className="block text-slate-400">تاريخ الاستحقاق:</span>
                  <span className="font-bold text-white">{currentClientDueDate}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Stack */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                onClick={() => onNavigate('record-payment')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل دفعة جديدة</span>
              </button>

              <button
                onClick={() => onNavigate('add-debt')}
                className="w-full bg-[#0b1d3a] hover:bg-[#0f2a54] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دين جديد</span>
              </button>

              <button 
                onClick={() => {
                  setToastMsg(`تم تصدير كشف حساب (${currentClientName}) بنجاح!`);
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>تصدير كشف حساب (PDF)</span>
              </button>
            </div>

          </div>

        </div>

        {/* LEFT COLUMN IN RTL (8 cols): Transaction History & Financial Ledger */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Ledger Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            
            {/* Ledger Filter Tabs & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-alexandria">
                  سجل المعاملات والمديونيات
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  جميع العمليات المسجلة على حساب {currentClientName} بالتفصيل
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveLedgerTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLedgerTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل ({transactions.length})
                </button>
                <button
                  onClick={() => setActiveLedgerTab('debts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLedgerTab === 'debts'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الديون
                </button>
                <button
                  onClick={() => setActiveLedgerTab('payments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLedgerTab === 'payments'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الدفعات
                </button>
              </div>
            </div>

            {/* Transactions Timeline List */}
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      tx.type === 'debt' ? 'bg-rose-100 text-rose-600' :
                      tx.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {tx.type === 'debt' ? <Plus className="w-5 h-5" /> :
                       tx.type === 'payment' ? <CreditCard className="w-5 h-5" /> :
                       <AlertCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-alexandria">
                          {tx.title}
                        </span>
                        {tx.status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tx.badgeColor}`}>
                            {tx.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {tx.desc}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1.5 inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {tx.date}
                      </span>
                    </div>
                  </div>

                  {tx.amount && (
                    <div className="text-left sm:text-right shrink-0">
                      <span className={`text-base font-extrabold font-alexandria block ${tx.amountColor}`}>
                        {tx.amount} <span className="text-xs font-normal text-slate-500">ر.س</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  لا توجد عمليات مسجلة في هذا القسم.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: ADD NEW DEBT */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-right">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">
                إضافة دين جديد على حساب {currentClientName}
              </h3>
              <button
                onClick={() => setIsAddDebtOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الفاتورة / المرجع
                </label>
                <input
                  type="text"
                  value={debtInvoiceNum}
                  onChange={(e) => setDebtInvoiceNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ الدين (ر.س) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  بيان الدين / الوصف
                </label>
                <textarea
                  rows={3}
                  placeholder="تفاصيل المشتريات أو سبب الدين..."
                  value={debtDesc}
                  onChange={(e) => setDebtDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#0b1d3a] hover:bg-[#0f2a54] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  حفظ وتأكيد الدين
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-right">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">
                تسجيل دفعة سداد من {currentClientName}
              </h3>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ الدفعة (ر.س) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات الدفعة / طريقة السداد
                </label>
                <input
                  type="text"
                  placeholder="نقداً، حوالة بنكية، شبكة..."
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  تأكيد استلام الدفعة
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DELETE CLIENT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-center border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-xs text-rose-600">
              <Trash2 className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 font-alexandria">
                حذف العميل
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف العميل <span className="font-bold text-slate-900 font-alexandria">«{currentClientName}»</span>؟
              </p>
            </div>

            {/* Outstanding Debt Notice if any */}
            {currentBalance > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-right flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-0.5">
                  <p className="font-bold">تنبيه بشأن المديونية القائمة:</p>
                  <p className="text-[11px] text-amber-700">
                    هذا العميل لديه رصيد مديونية غير مسدد بقيمة <span className="font-bold font-mono">{currentBalance.toLocaleString()} ر.س</span>. سيتم حذف كافة السجلات والمعاملات المالية نهائياً.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (client && onDeleteClient) {
                    onDeleteClient(client.id);
                  } else {
                    onNavigate('clients');
                  }
                  setIsDeleteModalOpen(false);
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs cursor-pointer font-alexandria flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
