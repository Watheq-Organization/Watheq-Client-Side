import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  ChevronDown,
  RefreshCw,
  Search,
  ArrowRightLeft,
  CreditCard,
  AlertCircle
} from 'lucide-react';

// --- Mock Data ---
const mockKpis = {
  totalRecordedSales: 15450,
  totalBankInflows: 15300,
  reconciledAmount: 14000,
  reconciledCount: 45,
  uncollectedAmount: 1450,
  uncollectedCount: 3,
};

const initialReconciledSales = [
  { id: 'INV-1042', time: '10:15 AM', amount: 350, customerName: 'محمد أحمد', bankSender: 'محمد أحمد', ref: 'TRX-98231', status: 'مطابق 100%' },
  { id: 'INV-1045', time: '11:30 AM', amount: 1200, customerName: 'شركة النور', bankSender: 'شركة النور', ref: 'TRX-98244', status: 'مطابق 100%' },
  { id: 'INV-1048', time: '01:20 PM', amount: 45, customerName: 'زبون نقدي', bankSender: 'محمود علي', ref: 'TRX-98256', status: 'مطابق 100%' },
  { id: 'INV-1050', time: '02:45 PM', amount: 800, customerName: 'خالد عبد الله', bankSender: 'خالد عبد الله', ref: 'TRX-98288', status: 'مطابق 100%' },
];

const uncollectedSales = [
  { id: 'INV-1043', items: '2 كرتونة زيت, 5 سكر 50ك', amount: 850, customerInfo: 'يوسف العلي - 0599123456', status: 'بانتظار الحوالة' },
  { id: 'INV-1052', items: '10 كرتونة حليب, 5 جبنة', amount: 600, customerInfo: 'سوبر ماركت الهدى - 0598765432', status: 'بانتظار الحوالة' },
];

const initialDiscrepancies = [
  { id: 'INV-1047', invoiceAmount: 100, bankAmount: 97, customerName: 'رامي سعيد', bankSender: 'رامي سعيد', issue: 'خصم عمولة بنكية (3 شيكل)' },
  { id: 'INV-1055', invoiceAmount: 500, bankAmount: 500, customerName: 'سعيد محمود', bankSender: 'منى علي', issue: 'اختلاف اسم المحول (زوجة/قريب)' },
];

const unmatchedInflows = [
  { time: '09:00 AM', amount: 150, bankSender: 'أحمد ياسين', ref: 'TRX-98110', notes: 'حوالة جوال باي بدون فاتورة' },
  { time: '12:45 PM', amount: 320, bankSender: 'مجهول', ref: 'TRX-98260', notes: 'إيداع صراف آلي' },
];

import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';

export default function MizanReconciliation() {
  const [activeTab, setActiveTab] = useState('reconciled');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState('بنك فلسطين');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const banks = ['بنك فلسطين', 'PalPay', 'جوال باي'];

  const [reconciledList, setReconciledList] = useState(initialReconciledSales);
  const [discrepanciesList, setDiscrepanciesList] = useState(initialDiscrepancies);
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<string[]>([]);
  const [selectedReconciled, setSelectedReconciled] = useState<string[]>([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState('اليوم');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periods = ['آخر ساعتين', 'اليوم', 'أمس', 'آخر 48 ساعة', 'هذا الأسبوع'];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredReconciledList = reconciledList.filter(sale => {
    const matchesSearch = sale.id.includes(searchQuery) || sale.customerName.includes(searchQuery) || sale.bankSender.includes(searchQuery) || sale.amount.toString().includes(searchQuery);
    const matchesType = filterType === 'all' || 
                       (filterType === 'auto' && sale.status.includes('100%')) || 
                       (filterType === 'manual' && !sale.status.includes('100%'));
    return matchesSearch && matchesType;
  });

  const handleCloseReconciled = () => {
    if (selectedReconciled.length === 0) return;
    setReconciledList(reconciledList.filter(sale => !selectedReconciled.includes(sale.id)));
    setSelectedReconciled([]);
  };

  const handleConfirmSelected = () => {
    if (selectedDiscrepancies.length === 0) return;
    
    const itemsToConfirm = discrepanciesList.filter(d => selectedDiscrepancies.includes(d.id));
    const newReconciledItems = itemsToConfirm.map(item => ({
      id: item.id,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amount: item.invoiceAmount,
      customerName: item.customerName,
      bankSender: item.bankSender,
      ref: 'TRX-' + Math.floor(Math.random() * 100000),
      status: 'تمت المراجعة والمطابقة'
    }));

    setReconciledList([...newReconciledItems, ...reconciledList]);
    setDiscrepanciesList(discrepanciesList.filter(d => !selectedDiscrepancies.includes(d.id)));
    setSelectedDiscrepancies([]);
    setActiveTab('reconciled');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    // Here you would normally upload the file to your server or parse it locally
    console.log("Processing file:", file.name, file.size);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsParsed(true);
    }, 2500); // Simulate AI parsing delay
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex" dir="rtl">
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="mizan"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          searchPlaceholder="البحث..."
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-emerald-600" />
            ميزان — مطابقة المبيعات الفورية مع كشف البنك
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            تأكد من دخول جميع مبيعاتك الفورية إلى حساباتك البنكية والمحافظ الإلكترونية
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          
          <div className="relative">
            <button 
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              onBlur={() => setTimeout(() => setIsPeriodDropdownOpen(false), 200)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                فترة المطابقة: <span className="text-emerald-700 dark:text-emerald-500">{selectedPeriod}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPeriodDropdownOpen && (
              <div 
                className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-20"
                onMouseDown={(e) => e.preventDefault()}
              >
                {periods.map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedPeriod === period ? 'text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          
          <div className="relative">
            <button 
              onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
              onBlur={() => setTimeout(() => setIsBankDropdownOpen(false), 200)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedBank}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBankDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10"
                onMouseDown={(e) => e.preventDefault()} // يمنع فقدان التركيز من الزر الرئيسي
              >
                {banks.map(bank => (
                  <button
                    key={bank}
                    onClick={() => {
                      setSelectedBank(bank);
                      setIsBankDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedBank === bank ? 'text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20/50' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      {!isParsed ? (
        <div 
          className={`bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed p-12 text-center mb-8 transition-colors cursor-pointer group ${
            isDragging 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40' 
              : 'border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20/50'
          }`}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.xlsx,.xls,.csv" 
          />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">جاري المعالجة...</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">جاري سحب حركات الإيداع ومطابقتها مع مبيعات اليوم الفورية (الذكاء الاصطناعي)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">اسحب وأفلت كشف الحساب هنا</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">يدعم ملفات PDF, Excel (.xlsx), و CSV الخاصة بالبنوك المحلية ومحافظ الدفع</p>
              <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm pointer-events-none">
                <FileSpreadsheet className="w-4 h-4" />
                تصفح الملفات
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h4 className="font-bold text-emerald-900 dark:text-emerald-400">تمت المطابقة بنجاح</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-500">تم سحب وتحليل كشف حساب بنك فلسطين ليوم {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
          <button onClick={() => setIsParsed(false)} className="text-emerald-700 dark:text-emerald-500 hover:text-emerald-900 dark:text-emerald-400 text-sm font-medium underline">
            رفع كشف آخر
          </button>
        </div>
      )}

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="absolute top-0 right-0 w-1 h-full bg-slate-800"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">إجمالي المبيعات الفورية</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{mockKpis.totalRecordedSales.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">₪</span></h3>
            </div>
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">المسجلة في النظام اليوم</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden hover:border-slate-300 transition-colors">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">إجمالي الحوالات المودعة</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{mockKpis.totalBankInflows.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">₪</span></h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-500">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">حسب كشف البنك المرفوع</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium mb-1">مبيعات مطابقة بنكياً 🟢</p>
              <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400">{mockKpis.reconciledAmount.toLocaleString()} <span className="text-sm font-normal text-emerald-700 dark:text-emerald-500">₪</span></h3>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-4 font-medium">{mockKpis.reconciledCount} فاتورة تم تأكيدها</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-red-800 dark:text-red-400 font-medium mb-1">مبيعات غير محصلة 🔴</p>
              <h3 className="text-2xl font-bold text-red-900 dark:text-red-400">{mockKpis.uncollectedAmount.toLocaleString()} <span className="text-sm font-normal text-red-700 dark:text-red-500">₪</span></h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-4 font-medium">{mockKpis.uncollectedCount} فواتير خرجت ولم تدخل حوالتها!</p>
        </div>
      </div>

      {/* Tabs & Data Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={() => setActiveTab('reconciled')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'reconciled' ? 'text-emerald-700 dark:text-emerald-500 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <CheckCircle2 className={`w-4 h-4 ${activeTab === 'reconciled' ? 'text-emerald-600' : 'text-slate-400'}`} />
            مبيعات مطابقة تماماً
            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-500 px-2 py-0.5 rounded-full text-xs ml-1">{reconciledList.length}</span>
            {activeTab === 'reconciled' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>}
          </button>
          
          <button 
            onClick={() => setActiveTab('uncollected')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'uncollected' ? 'text-red-700 dark:text-red-500 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <XCircle className={`w-4 h-4 ${activeTab === 'uncollected' ? 'text-red-600' : 'text-slate-400'}`} />
            مبيعات غير محصلة
            <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-500 px-2 py-0.5 rounded-full text-xs ml-1">{mockKpis.uncollectedCount}</span>
            {activeTab === 'uncollected' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>}
          </button>

          <button 
            onClick={() => setActiveTab('discrepancies')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'discrepancies' ? 'text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeTab === 'discrepancies' ? 'text-amber-500' : 'text-slate-400'}`} />
            فروقات تحتاج مراجعة
            <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs ml-1">{discrepanciesList.length}</span>
            {activeTab === 'discrepancies' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>}
          </button>

          <button 
            onClick={() => setActiveTab('unmatched')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'unmatched' ? 'text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'unmatched' ? 'text-blue-500' : 'text-slate-400'}`} />
            حوالات بدون فواتير
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs ml-1">2</span>
            {activeTab === 'unmatched' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          
          {/* Reconciled Tab */}
          {activeTab === 'reconciled' && (
            <div>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الفاتورة، الاسم، أو المبلغ..." 
                      className="pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="all">جميع المطابقات</option>
                    <option value="auto">مطابقة تلقائية (100%)</option>
                    <option value="manual">مطابقة يدوية (بعد المراجعة)</option>
                  </select>
                </div>
                <button 
                  onClick={handleCloseReconciled}
                  disabled={selectedReconciled.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${selectedReconciled.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد وتأكيد الإقفال اليومي {selectedReconciled.length > 0 ? `(${selectedReconciled.length})` : ''}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedReconciled.length === reconciledList.length && reconciledList.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReconciled(reconciledList.map(s => s.id));
                            } else {
                              setSelectedReconciled([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3">رقم الفاتورة</th>
                      <th className="px-6 py-3">الوقت</th>
                      <th className="px-6 py-3">المبلغ (₪)</th>
                      <th className="px-6 py-3">اسم المشتري (الكاشير)</th>
                      <th className="px-6 py-3">اسم المحول (البنك)</th>
                      <th className="px-6 py-3">رقم الحوالة المرجعي</th>
                      <th className="px-6 py-3 text-center">حالة التطابق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredReconciledList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                          {reconciledList.length === 0 ? 'تم إقفال جميع الفواتير المطابقة بنجاح! 🔒' : 'لا توجد نتائج تطابق خيارات البحث الحالية.'}
                        </td>
                      </tr>
                    ) : (
                      filteredReconciledList.map((sale, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedReconciled.includes(sale.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReconciled([...selectedReconciled, sale.id]);
                                } else {
                                  setSelectedReconciled(selectedReconciled.filter(id => id !== sale.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{sale.id}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{sale.time}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{sale.amount}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.customerName}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.bankSender}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{sale.ref}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-500 px-2.5 py-1 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Uncollected Tab */}
          {activeTab === 'uncollected' && (
            <div>
              <div className="p-4 border-b border-red-100 bg-red-50 dark:bg-red-900/20/50">
                <p className="text-red-700 dark:text-red-500 text-sm flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  انتباه: الفواتير التالية تم إخراج بضاعتها وتسجيلها كـ "دفع بنكي"، ولكن لم يظهر أي إيداع مقابل لها في كشف البنك المرفوع!
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3">رقم الفاتورة</th>
                      <th className="px-6 py-3">الأصناف المبيعة</th>
                      <th className="px-6 py-3">المبلغ (₪)</th>
                      <th className="px-6 py-3">بيانات الزبون</th>
                      <th className="px-6 py-3">الحالة</th>
                      <th className="px-6 py-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {uncollectedSales.map((sale, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{sale.id}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.items}</td>
                        <td className="px-6 py-4 font-bold text-red-600">{sale.amount}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.customerInfo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-500 px-2.5 py-1 rounded-full text-xs font-bold">
                            <XCircle className="w-3 h-3" />
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 text-red-600 hover:bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap">
                            تحويل لدين ومطالبة الزبون ⚠️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discrepancies Tab */}
          {activeTab === 'discrepancies' && (
            <div>
              {discrepanciesList.length > 0 && (
                <div className="p-4 border-b border-amber-100 dark:border-amber-800/50 flex justify-between items-center bg-amber-50/30 dark:bg-amber-900/20">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      checked={selectedDiscrepancies.length === discrepanciesList.length && discrepanciesList.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDiscrepancies(discrepanciesList.map(d => d.id));
                        } else {
                          setSelectedDiscrepancies([]);
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تحديد الكل</span>
                    {selectedDiscrepancies.length > 0 && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        {selectedDiscrepancies.length} محدد
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleConfirmSelected}
                    disabled={selectedDiscrepancies.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${selectedDiscrepancies.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    اعتماد وتأكيد المحدد
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 w-12 text-center"></th>
                      <th className="px-6 py-3">رقم الفاتورة</th>
                      <th className="px-6 py-3">المبلغ بالفاتورة</th>
                      <th className="px-6 py-3">المبلغ بالبنك</th>
                      <th className="px-6 py-3">اسم المشتري / المحول</th>
                      <th className="px-6 py-3">نوع الاختلاف</th>
                      <th className="px-6 py-3 text-center">الإجراء المطلوب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {discrepanciesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                          لا يوجد فروقات تحتاج لمراجعة، كل شيء ممتاز! 🎉
                        </td>
                      </tr>
                    ) : (
                      discrepanciesList.map((disc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedDiscrepancies.includes(disc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDiscrepancies([...selectedDiscrepancies, disc.id]);
                                } else {
                                  setSelectedDiscrepancies(selectedDiscrepancies.filter(id => id !== disc.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{disc.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{disc.invoiceAmount} ₪</td>
                          <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-500">{disc.bankAmount} ₪</td>
                          <td className="px-6 py-4">
                            <div className="text-slate-900 dark:text-white">{disc.customerName} (كاشير)</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{disc.bankSender} (بنك)</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-medium">
                              {disc.issue}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              {disc.invoiceAmount !== disc.bankAmount ? (
                                <button 
                                  onClick={() => {
                                    setSelectedDiscrepancies([disc.id]);
                                    setTimeout(handleConfirmSelected, 0); // Hack to wait for state update
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                                >
                                  قبول الفرق كعمولة بنكية
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setSelectedDiscrepancies([disc.id]);
                                    setTimeout(handleConfirmSelected, 0);
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                                >
                                  تأكيد ربط الحوالة بالفاتورة
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched Inflows Tab */}
          {activeTab === 'unmatched' && (
            <div>
              <div className="p-4 border-b border-blue-100 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20/50">
                <p className="text-blue-700 dark:text-blue-400 text-sm flex items-center gap-2 font-medium">
                  <HelpCircle className="w-4 h-4" />
                  مبالغ تم إيداعها في الحساب البنكي، ولكن لا يوجد فواتير مبيعات مسجلة في الكاشير تطابقها.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3">وقت الحوالة</th>
                      <th className="px-6 py-3">المبلغ (₪)</th>
                      <th className="px-6 py-3">اسم المحول / المصدر</th>
                      <th className="px-6 py-3">الرقم المرجعي</th>
                      <th className="px-6 py-3">ملاحظات البنك</th>
                      <th className="px-6 py-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {unmatchedInflows.map((inflow, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inflow.time}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-500">{inflow.amount}</td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inflow.bankSender}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{inflow.ref}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{inflow.notes}</td>
                        <td className="px-6 py-4 text-center">
                          <button className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap">
                            إنشاء فاتورة مبيعات سريعة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          تصدير تقرير المطابقة اليومي (PDF)
        </button>
      </div>

        </main>
      </div>
    </div>
  );
}
