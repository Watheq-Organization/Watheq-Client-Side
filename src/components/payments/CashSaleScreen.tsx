import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Receipt,
  CheckCircle2,
  Lock,
  Info,
  Check
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';

export const CashSaleScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customerType, setCustomerType] = useState<'guest' | 'registered' | 'business'>('guest');
  const [phonePrefix, setPhonePrefix] = useState<string>('+970');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'transfer' | 'wallet'>('cash');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Calculations
  const numericAmount = parseFloat(amount) || 0;

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
      dir="rtl"
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="cash-sale"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          searchPlaceholder="البحث..."
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Breadcrumbs & Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <button 
                onClick={() => navigate(PATHS.PAYMENTS)}
                className="hover:text-[#051838] transition-colors"
              >
                سجل المدفوعات
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-[#051838]">تسجيل بيع نقدي فوري</span>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#051838]">
                تسجيل مبيعات / دفعة نقدية فورية
              </h1>
              <p className="mt-1.5 text-slate-500 font-medium">
                تسجيل حركة بيع نقدي مباشر، إصدار فاتورة فورية، وإرسال نسخة إلكترونية للزبون بدون فتح قيد دين أو مطالبات لاحقة.
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">رقم الفاتورة المؤقت</p>
                <p className="font-bold text-slate-800 font-sans tracking-wide">INV-2025-0841</p>
              </div>
              <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">تاريخ وتوقيت البيع</p>
                <p className="font-bold text-slate-800">اليوم، 14:32 م</p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">سداد فوري غير آجل (مغلق)</span>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Right Column (Forms) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 1: Customer Details */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-[#051838]">1. بيانات العميل / المشتري</h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                    اختياري لمبيعات الزبائن العابرين
                  </span>
                </div>
                
                <div className="p-5 space-y-5">
                  {/* Customer Type Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label 
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        customerType === 'guest' 
                          ? 'border-[#051838] bg-slate-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="customerType" 
                        value="guest" 
                        checked={customerType === 'guest'} 
                        onChange={() => setCustomerType('guest')}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800">زبون عابر / نقدي سريع</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${customerType === 'guest' ? 'border-[#051838]' : 'border-slate-300'}`}>
                          {customerType === 'guest' && <div className="w-2 h-2 rounded-full bg-[#051838]"></div>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">بدون تسجيل ملف مالي</span>
                    </label>

                    <label 
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        customerType === 'registered' 
                          ? 'border-[#051838] bg-slate-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="customerType" 
                        value="registered" 
                        checked={customerType === 'registered'} 
                        onChange={() => setCustomerType('registered')}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800">عميل مسجل بالقائمة</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${customerType === 'registered' ? 'border-[#051838]' : 'border-slate-300'}`}>
                          {customerType === 'registered' && <div className="w-2 h-2 rounded-full bg-[#051838]"></div>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">ربط بسجل العملاء</span>
                    </label>

                    <label 
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        customerType === 'business' 
                          ? 'border-[#051838] bg-slate-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="customerType" 
                        value="business" 
                        checked={customerType === 'business'} 
                        onChange={() => setCustomerType('business')}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800">منشأة تجارية / ضريبية</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${customerType === 'business' ? 'border-[#051838]' : 'border-slate-300'}`}>
                          {customerType === 'business' && <div className="w-2 h-2 rounded-full bg-[#051838]"></div>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">تسجيل الرقم الضريبي</span>
                    </label>
                  </div>

                  {/* Customer Details Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">اسم صاحب الحساب المحول منه</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          defaultValue="زبون نقدي مباشر"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">رقم الجوال (لإرسال إشعار الفاتورة الفوري)</label>
                      <div className="flex" dir="ltr">
                        <div className="relative">
                          <select
                            value={phonePrefix}
                            onChange={(e) => setPhonePrefix(e.target.value)}
                            className="appearance-none bg-slate-100 hover:bg-slate-200 border border-r-0 border-slate-200 rounded-l-xl pl-3 pr-8 py-2.5 text-sm font-semibold text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all cursor-pointer h-full"
                          >
                            <option value="+970">+970</option>
                            <option value="+972">+972</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="5x xxx xxxx"
                            className="w-full bg-slate-50 border border-slate-200 rounded-r-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sales Details */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-[#051838]">2. تفاصيل المبيعات</h2>
                  </div>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-bold text-slate-700">إجمالي مبلغ البيع (شامل الضريبة)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-sm font-semibold">ر.س</span>
                        </div>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-4 pl-12 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">وصف المبيعات (المنتجات / الخدمات)</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثال: أجهزة إلكترونية، صيانة عامة، إلخ..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#051838]">3. طريقة الدفع الفوري المستلمة</h2>
                    <p className="text-[11px] text-slate-500 font-medium">اختر وسيلة التحصيل الفعلية التي تم استلام المبلغ بها حالياً</p>
                  </div>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label 
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        paymentMethod === 'cash' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cash" 
                        checked={paymentMethod === 'cash'} 
                        onChange={() => setPaymentMethod('cash')}
                        className="sr-only" 
                      />
                      {paymentMethod === 'cash' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Banknote className={`w-6 h-6 mb-2 ${paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-sm ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-slate-700'}`}>نقداً / كاش</span>
                      <span className="text-[10px] text-slate-400 mt-1">استلام الخزينة</span>
                    </label>

                    <label 
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        paymentMethod === 'pos' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="pos" 
                        checked={paymentMethod === 'pos'} 
                        onChange={() => setPaymentMethod('pos')}
                        className="sr-only" 
                      />
                      {paymentMethod === 'pos' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'pos' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-sm ${paymentMethod === 'pos' ? 'text-emerald-700' : 'text-slate-700'}`}>مدى / شبكة</span>
                      <span className="text-[10px] text-slate-400 mt-1">بطاقة بنكية POS</span>
                    </label>

                    <label 
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        paymentMethod === 'transfer' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="transfer" 
                        checked={paymentMethod === 'transfer'} 
                        onChange={() => setPaymentMethod('transfer')}
                        className="sr-only" 
                      />
                      {paymentMethod === 'transfer' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Landmark className={`w-6 h-6 mb-2 ${paymentMethod === 'transfer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-sm ${paymentMethod === 'transfer' ? 'text-emerald-700' : 'text-slate-700'}`}>تحويل بنكي</span>
                      <span className="text-[10px] text-slate-400 mt-1">فوري / سريع</span>
                    </label>

                    <label 
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        paymentMethod === 'wallet' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="wallet" 
                        checked={paymentMethod === 'wallet'} 
                        onChange={() => setPaymentMethod('wallet')}
                        className="sr-only" 
                      />
                      {paymentMethod === 'wallet' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'wallet' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-sm ${paymentMethod === 'wallet' ? 'text-emerald-700' : 'text-slate-700'}`}>محفظة إلكترونية</span>
                      <span className="text-[10px] text-slate-400 mt-1">Apple Pay / STC</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">المرجع البنكي / رقم العملية (اختياري)</label>
                      <input
                        type="text"
                        placeholder="رقم إيصال الشبكة أو الحوالة إن وُجد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all placeholder:font-normal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">صندوق الإيداع / الحساب</label>
                      <input
                        type="text"
                        defaultValue="الصندوق الرئيسي (الخزينة النقدية اليومية)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#051838] focus:border-transparent transition-all"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column (Sidebar Summary) */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5 sticky top-24">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-400" />
                    <h2 className="text-base font-bold text-[#051838]">ملخص الفاتورة النقدية</h2>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold border border-emerald-100">
                    غير آجل
                  </span>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-emerald-800">الإجمالي المدفوع فوراً:</span>
                    <div className="text-left" dir="ltr">
                      <span className="text-3xl font-bold text-emerald-600 tracking-tight font-sans">
                        {numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-600/80 mt-1 text-left" dir="ltr">فقط ألف ومئتان وخمسون ريالاً سعودياً لا غير</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                      <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors leading-relaxed">
                      إرسال نسخة الفاتورة الإلكترونية عبر واتساب تلقائياً إلى رقم الزبون
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                      <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors leading-relaxed">
                      إرفاق إقرار باستلام كامل المبلغ نقداً / بدون أي ذمم مالية عالقة
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                      <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors leading-relaxed">
                      طباعة الإيصال الحراري الفوري (طابعة الكاشير POS)
                    </span>
                  </label>
                </div>

                <div className="space-y-2 pt-2">
                  <button className="w-full flex items-center justify-center gap-2 bg-[#007a3d] hover:bg-[#006633] text-white py-3 rounded-xl font-bold transition-colors shadow-sm cursor-pointer">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>إتمام البيع وإصدار الفاتورة النقدية</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate(PATHS.PAYMENTS)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    <span>إلغاء العملية والتراجع</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-2 text-[#007a3d]">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">موثق ومسجل بنظام وثق للسداد الفوري المعتمد</span>
                </div>
              </div>

              <div className="bg-[#f0f4f8] rounded-2xl p-4 border border-[#e2e8f0] flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1">الفرق بين البيع النقدي والدين الآجل</h3>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    هذه العملية تسجل كقبض فوري وتغلق الدورة المالية مباشرة دون إبقاء التزام مالي أو إرسال مطالبات سداد لاحقة على المشتري.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CashSaleScreen;
