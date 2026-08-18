import React, { useState } from 'react';
import { ScreenType } from './Header';
import { Client } from '../types/client';
import { 
  CreditCard, 
  Banknote, 
  Landmark, 
  Wallet, 
  Calendar, 
  Upload, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  X, 
  User, 
  FileText,
  Sparkles,
  Loader2,
  ChevronLeft
} from 'lucide-react';

interface RecordPaymentViewProps {
  onNavigate: (screen: ScreenType) => void;
  clients?: Client[];
  selectedClient?: Client;
  onSelectClient?: (client: Client) => void;
  onRecordPayment?: (paymentData: {
    clientId: string;
    clientName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'cash' | 'bank' | 'wallet';
    notes: string;
    receiptFile?: File | null;
  }) => void;
}

export const RecordPaymentView: React.FC<RecordPaymentViewProps> = ({
  onNavigate,
  clients = [],
  selectedClient: initialClient,
  onSelectClient,
  onRecordPayment,
}) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialClient || clients[0] || null
  );

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'wallet'>('cash');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Client's numeric debt calculation
  const currentDebtNumeric = selectedClient
    ? parseFloat(String(selectedClient.debt).replace(/,/g, '')) || 0
    : 4500;

  const enteredAmountNum = parseFloat(paymentAmount) || 0;
  const remainingBalance = Math.max(0, currentDebtNumeric - enteredAmountNum);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredAmountNum || enteredAmountNum <= 0) {
      alert('يرجى إدخال مبلغ دفعة صحيح.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (onRecordPayment && selectedClient) {
        onRecordPayment({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          amount: enteredAmountNum,
          paymentDate,
          paymentMethod,
          notes,
        });
      }

      setSuccessToast(`تم تسجيل دفعة بقيمة ${enteredAmountNum.toLocaleString()} ر.س لحساب (${selectedClient?.name || 'العميل'}) بنجاح!`);

      setTimeout(() => {
        setSuccessToast(null);
        onNavigate('clients');
      }, 1800);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Toast Alert Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* TOP BREADCRUMB & SECURITY BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-slate-900">الرئيسية</button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <button onClick={() => onNavigate('clients')} className="hover:text-slate-900">سجل المدفوعات</button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-emerald-700 font-bold">تسجيل دفعة جديدة</span>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>نظام دفع آمن ومشفّر</span>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="text-right">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria tracking-tight">
          تسجيل دفعة جديدة
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          قم بتسجيل المبالغ المستلمة من العميل لتحديث رصيده المالي فوراً.
        </p>
      </div>

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* RIGHT COLUMN (7 cols in RTL): Form and Details */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Client Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم العميل
              </label>

              {clients.length > 1 ? (
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const found = clients.find(c => c.id === e.target.value);
                    if (found) {
                      setSelectedClient(found);
                      if (onSelectClient) onSelectClient(found);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) - مديونية: {c.debt} ر.س
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{selectedClient?.name || 'أحمد محمد علي'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    تم اختيار العميل من صفحة التفاصيل السابقة
                  </span>
                </div>
              )}
            </div>

            {/* 2. Payment Amount & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Payment Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ الدفعة (ريال سعودي) <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    min="1"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-12"
                  />
                  <div className="absolute left-3.5 text-xs font-bold text-slate-500 pointer-events-none">
                    SR
                  </div>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاريخ الدفع <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

            </div>

            {/* 3. Payment Method 3-Card Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                طريقة الدفع <span className="text-emerald-600">*</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {/* Method 1: Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold font-alexandria">نقدي (Cash)</span>
                </button>

                {/* Method 2: Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'bank'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold font-alexandria">تحويل بنكي</span>
                </button>

                {/* Method 3: Wallet */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold font-alexandria">محفظة</span>
                </button>
              </div>
            </div>

            {/* 4. Notes Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                rows={3}
                placeholder="أضف تفاصيل أخرى عن الدفعة..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* 5. Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري حفظ الدفعة...</span>
                  </>
                ) : (
                  <>
                    <span>💾 حفظ الدفعة</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('clients')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </form>

        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN (5 cols in RTL): Receipt Upload & Summary */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Proof of Payment / Receipt Dropzone */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 font-alexandria flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                إثبات الدفع / الإيصال
              </span>
              <span className="text-[10px] text-slate-400">اختياري</span>
            </div>

            {/* Dropzone Area */}
            <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {receiptImage ? (
                <div className="space-y-2">
                  <img
                    src={receiptImage}
                    alt="Receipt Preview"
                    className="w-32 h-32 object-cover rounded-xl mx-auto shadow-md border"
                  />
                  <span className="text-xs text-emerald-600 font-bold block">✓ تم تحميل صورة الإيصال</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">رفع صورة الإيصال</span>
                  <span className="text-[10px] text-slate-400 font-mono">PNG, JPG بحد أقصى 5 ميجابايت</span>
                </>
              )}
            </label>

            {/* Notice Alert Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2 text-right">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                رفع الإيصال يساعد على تسوية النزاعات المالية بشكل أسرع ويوثق العملية للمفوض.
              </p>
            </div>
          </div>

          {/* 2. Client Balance Summary (Dark Navy Card) */}
          <div className="bg-[#0b1d3a] text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4 text-right">
            
            <div className="border-b border-slate-700/60 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-alexandria">
                ملخص رصيد العميل
              </span>
              <span className="text-[10px] bg-white/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                تحديث مباشر
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">إجمالي المديونية الحالية:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-alexandria">
                  {currentDebtNumeric.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-300">SR</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">الرصيد بعد الدفع:</span>
              <div className="flex items-baseline gap-1.5 text-emerald-400">
                <span className="text-2xl font-extrabold font-alexandria">
                  {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-emerald-400/80">SR</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>مدى التزام العميل:</span>
                <span className="font-bold text-emerald-400 font-mono">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

          </div>

          {/* 3. Quick Help Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 text-right">
            <span className="text-xs font-bold text-slate-900 font-alexandria block">
              مساعدة سريعة
            </span>
            
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>سيتم إرسال إشعار SMS للعميل فور حفظ الدفعة.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>تأكد من مطابقة تاريخ التحويل البنكي مع تاريخ الإيصال.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
