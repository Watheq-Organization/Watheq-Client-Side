import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Download,
  Banknote,
  CreditCard,
  Users,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  RotateCw,
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Clock,
} from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { OverdueDebtsReportView } from './OverdueDebtsReportView';
import { getDashboardSummary } from '../../services/dashboardService';
import {
  getCollectionsReport,
  exportCollectionsReportCsv,
  printCollectionsReportHtml,
  formatPaymentMethod,
  toReportErrorMessage,
} from '../../services/reportService';
import type { CollectionsReportResponse, CollectionItem } from '../../types/report';

type TimeRange = 'all' | 'daily' | 'weekly' | 'monthly';

export const ReportsScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tab: 'collections' | 'overdue'
  const isOverdueInitial = location.pathname === PATHS.OVERDUE_DEBTS_REPORT;
  const [activeReportTab, setActiveReportTab] = useState<'collections' | 'overdue'>(
    isOverdueInitial ? 'overdue' : 'collections'
  );

  useEffect(() => {
    if (location.pathname === PATHS.OVERDUE_DEBTS_REPORT) {
      setActiveReportTab('overdue');
    } else if (location.pathname === PATHS.COLLECTIONS_REPORT) {
      setActiveReportTab('collections');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'collections' | 'overdue') => {
    setActiveReportTab(tab);
    if (tab === 'overdue') {
      navigate(PATHS.OVERDUE_DEBTS_REPORT);
    } else {
      navigate(PATHS.COLLECTIONS_REPORT);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'نقداً' | 'تحويل بنكي' | 'بطاقة / محفظة'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<CollectionsReportResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;

  // Overall dashboard stats from backend (0 if none)
  const [stats, setStats] = useState({
    collections: 0,
    debts: 0,
    activeCustomers: 0,
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Dashboard summary from real backend
  useEffect(() => {
    getDashboardSummary()
      .then((data) => {
        if (data) {
          setStats({
            collections: typeof data.collectedAmount === 'number' ? data.collectedAmount : 0,
            debts: typeof data.remainingAmount === 'number' ? data.remainingAmount : 0,
            activeCustomers: typeof data.customersCount === 'number' ? data.customersCount : 0,
          });
        }
      })
      .catch(() => {
        setStats({ collections: 0, debts: 0, activeCustomers: 0 });
      });
  }, []);

  // Fetch collections report from https://whateq.runasp.net/api/reports/collections
  const fetchCollections = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      let startStr = fromDate;
      let endStr = toDate;

      if (!fromDate && !toDate && timeRange !== 'all') {
        const today = new Date();
        endStr = today.toISOString().split('T')[0];
        if (timeRange === 'daily') {
          startStr = endStr;
        } else if (timeRange === 'weekly') {
          const pastWeek = new Date();
          pastWeek.setDate(today.getDate() - 7);
          startStr = pastWeek.toISOString().split('T')[0];
        } else if (timeRange === 'monthly') {
          const pastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startStr = pastMonth.toISOString().split('T')[0];
        }
      }

      const params = {
        fromDate: startStr ? `${startStr}T00:00:00Z` : undefined,
        toDate: endStr ? `${endStr}T23:59:59Z` : undefined,
        pageNumber,
        pageSize,
      };

      const result = await getCollectionsReport(params);
      setReportData(result);
      setServerError(null);

      if (result && result.totalCollected > 0) {
        setStats((prev) => ({
          ...prev,
          collections: result.totalCollected,
        }));
      }
    } catch (err) {
      console.warn('Failed to load collections from server:', err);
      setServerError(toReportErrorMessage(err));
      setReportData({
        totalCollected: 0,
        totalRecords: 0,
        pageNumber: 1,
        pageSize: 20,
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [timeRange, fromDate, toDate, pageNumber, pageSize]);

  // Client-side filtering by query & method
  const filteredCollections = useMemo(() => {
    if (!reportData || !reportData.items) return [];
    let list = reportData.items;

    if (methodFilter !== 'all') {
      list = list.filter((item) => formatPaymentMethod(item.paymentMethod) === methodFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.customerName.toLowerCase().includes(q) ||
          String(item.receiptNumber || '').toLowerCase().includes(q) ||
          String(item.id).toLowerCase().includes(q)
      );
    }

    return list;
  }, [reportData, searchQuery, methodFilter]);

  // Dynamic Chart generation from REAL collections data (no hardcoded fake bars)
  const chartPoints = useMemo(() => {
    if (reportData?.chart && reportData.chart.length > 0) {
      return reportData.chart.map((pt) => ({
        label: pt.label,
        collections: pt.amount,
        debts: 0,
      }));
    }

    if (!reportData || reportData.items.length === 0) {
      return [];
    }

    // Group real collection amounts by period
    const groups: Record<string, number> = {};
    reportData.items.forEach((item) => {
      const dateKey = item.date ? item.date.split('T')[0] : 'أخرى';
      groups[dateKey] = (groups[dateKey] || 0) + item.amount;
    });

    const entries = Object.entries(groups);
    if (entries.length === 0) return [];

    return entries.map(([label, collections]) => ({
      label,
      collections,
      debts: 0,
    }));
  }, [reportData]);

  const maxChartVal = useMemo(() => {
    if (chartPoints.length === 0) return 1000;
    const max = Math.max(...chartPoints.map((p) => p.collections));
    return max > 0 ? max * 1.2 : 1000;
  }, [chartPoints]);

  const handleExportCsv = () => {
    if (!reportData || reportData.items.length === 0) {
      showToast('لا توجد بيانات تحصيلات مسجلة للتصدير');
      return;
    }
    exportCollectionsReportCsv(
      filteredCollections.length > 0 ? filteredCollections : reportData.items,
      `تقرير_التحصيلات_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast('تم تصدير تقرير التحصيلات بنجاح كملف CSV');
  };

  const handlePrintPdf = () => {
    if (!reportData || reportData.items.length === 0) {
      showToast('لا توجد بيانات تحصيلات مسجلة للطباعة');
      return;
    }
    const label = fromDate && toDate ? `من ${fromDate} إلى ${toDate}` : 'كافة السجلات المسجلة';
    printCollectionsReportHtml(
      {
        ...reportData,
        items: filteredCollections.length > 0 ? filteredCollections : reportData.items,
      },
      label
    );
    showToast('جاري فتح نافذة طباعة وتصدير التقرير...');
  };

  const handleViewReceipt = (item: CollectionItem) => {
    const paymentId = item.paymentId || item.id;
    navigate(`/payments/${paymentId}/receipt`, {
      state: {
        payment: {
          id: paymentId,
          receiptNumber: item.receiptNumber || `REC-${paymentId}`,
          amount: item.amount,
          date: item.date,
          customerName: item.customerName,
          method: formatPaymentMethod(item.paymentMethod),
          status: item.status || 'تم التحقق',
        },
      },
    });
  };

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-white/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="reports"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في التحصيلات والسندات..."
        />

        {/* Reports Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Sub-navigation Tabs: تقرير التحصيلات / تقرير الديون المتأخرة */}
          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200/80 pb-4">
            <button
              type="button"
              onClick={() => handleTabChange('collections')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeReportTab === 'collections'
                  ? 'bg-[#051838] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>تقرير التحصيلات (Collections)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('overdue')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeReportTab === 'overdue'
                  ? 'bg-[#051838] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-rose-500" />
              <span>تقرير الديون المتأخرة (Overdue Debts)</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                جديد
              </span>
            </button>
          </div>

          {activeReportTab === 'overdue' ? (
            <OverdueDebtsReportView />
          ) : (
            <>
              {/* Top Title & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold font-cairo text-slate-900 tracking-tight">
                  تقرير التحصيلات والبيانات المالية
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API مباشر
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500 font-cairo">
                بيانات حية مباشرة من الخادم لمتابعة سندات القبض، المبالغ المحصلة، والمديونيات
              </p>
            </div>

            {/* Actions: Refresh, CSV, PDF */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fetchCollections}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="تحديث البيانات من الخادم"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="تصدير كملف CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#051838] hover:bg-[#0c2b5e] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 text-white" />
                <span>تصدير / طباعة PDF</span>
              </button>
            </div>
          </div>

          {/* Metric / Stat Cards (3 Top Cards - Pure Live Data) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: إجمالي التحصيلات */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Banknote className="w-6 h-6" />
                </div>
                <span className="text-slate-500 text-sm font-medium">إجمالي التحصيلات</span>
              </div>

              <div className="mt-5 text-right">
                <div className="flex items-baseline gap-1.5 justify-start">
                  <span className="text-3xl font-bold font-cairo text-[#047857] tracking-tight">
                    {stats.collections.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 font-cairo">شيكل</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {stats.collections > 0 ? 'مبالغ مسددة مؤكدة من الخادم' : 'لا توجد تحصيلات مسجلة بعد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: الديون القائمة */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-slate-500 text-sm font-medium">الديون القائمة</span>
              </div>

              <div className="mt-5 text-right">
                <div className="flex items-baseline gap-1.5 justify-start">
                  <span className="text-3xl font-bold font-cairo text-[#051838] tracking-tight">
                    {stats.debts.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 font-cairo">شيكل</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {stats.debts > 0 ? 'مستحقات مسجلة في النظام' : 'لا توجد ديون مسجلة بعد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: العملاء النشطون */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-slate-500 text-sm font-medium">العملاء النشطون</span>
              </div>

              <div className="mt-5 text-right">
                <div className="flex items-baseline gap-1.5 justify-start">
                  <span className="text-3xl font-bold font-cairo text-slate-900 tracking-tight">
                    {stats.activeCustomers.toLocaleString('ar-SA')}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {stats.activeCustomers > 0
                      ? `${stats.activeCustomers.toLocaleString('ar-SA')} عميل مسجل`
                      : 'لا يوجد عملاء مسجلون بعد'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar: Time Range & Custom Date */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Range Pills */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: 'كافة الفترات' },
                  { id: 'daily', label: 'اليوم' },
                  { id: 'weekly', label: 'آخر 7 أيام' },
                  { id: 'monthly', label: 'هذا الشهر' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setTimeRange(chip.id);
                    setFromDate('');
                    setToDate('');
                  }}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    timeRange === chip.id && !fromDate && !toDate
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Custom Dates & Method */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">من:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#051838]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">إلى:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#051838]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">طريقة الدفع:</span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#051838]"
                >
                  <option value="all">الكل</option>
                  <option value="نقداً">نقداً</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="بطاقة / محفظة">بطاقة / محفظة</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart Section: توجهات التحصيل (Dynamic or Clean Zero State) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold font-cairo text-slate-900">
                توجهات التحصيل المالي المباشر
              </h2>

              <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#007a3d]" />
                  <span>التحصيلات الفعلية</span>
                </div>
              </div>
            </div>

            {chartPoints.length === 0 ? (
              <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700 font-cairo">
                  لا توجد حركات مالية مسجلة على الخادم في هذا النطاق لعرض الرسم البياني
                </p>
                <p className="text-xs text-slate-400 mt-1 font-cairo">
                  عند تسجيل عمليات تحصيل أو سداد جديدة، ستظهر الأعمدة والمؤشرات البيانية هنا تلقائياً.
                </p>
              </div>
            ) : (
              <div className="relative pt-4 pb-2">
                <div className="flex">
                  {/* Bars Area */}
                  <div className="flex-1 relative h-56 sm:h-64 border-r border-slate-200/80">
                    <div className="absolute inset-0 pb-8 flex items-end justify-around px-2 sm:px-6">
                      {chartPoints.map((item, idx) => {
                        const heightPercent = Math.min(100, (item.collections / maxChartVal) * 100);
                        return (
                          <div
                            key={`chart-bar-${item.label}-${idx}`}
                            className="flex flex-col items-center justify-end h-full flex-1 max-w-[80px]"
                          >
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-5 sm:w-8 bg-[#007a3d] hover:bg-[#009148] rounded-t-sm transition-all duration-300 relative cursor-pointer shadow-xs group"
                            >
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-cairo py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg z-20 pointer-events-none">
                                {item.collections.toLocaleString('ar-SA')} شيكل
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-around px-2 sm:px-6">
                      {chartPoints.map((item, idx) => (
                        <span
                          key={`x-${item.label}-${idx}`}
                          className="text-[11px] text-slate-500 font-medium flex-1 text-center truncate"
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-cairo shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">تنبيه من خادم البيانات</p>
                  <p className="text-xs text-amber-700 mt-0.5">{serverError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {serverError.includes('تسجيل الدخول') || serverError.includes('401') ? (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 bg-[#051838] hover:bg-[#072454] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تسجيل الدخول الآن
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchCollections}
                    className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collections Report Table: جدول التحصيلات الحقيقي من الخادم */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-slate-900">
                  سجل عمليات التحصيل المباشرة (Collections Report)
                </h2>
                <p className="text-xs text-slate-500">
                  سندات القبض المسجلة المستلمة من رابط الـ API: https://whateq.runasp.net/api/reports/collections
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث بالعميل أو رقم السند..."
                    className="bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#051838]"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs bg-slate-50/50">
                    <th className="px-6 py-4">رقم السند</th>
                    <th className="px-6 py-4">اسم العميل</th>
                    <th className="px-6 py-4">المبلغ المحصل</th>
                    <th className="px-6 py-4">تاريخ السداد</th>
                    <th className="px-6 py-4">طريقة الدفع</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RotateCw className="w-6 h-6 animate-spin text-[#051838]" />
                          <span className="text-xs font-cairo">جاري تحميل البيانات من الخادم...</span>
                        </div>
                      </td>
                    </tr>
                  ) : serverError ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto p-4">
                          <AlertCircle className="w-8 h-8 text-amber-500" />
                          <p className="font-bold text-slate-800 text-sm font-cairo">
                            تعذر تحميل البيانات من السيرفر
                          </p>
                          <p className="text-xs text-slate-500 font-cairo text-center leading-relaxed">
                            {serverError}
                          </p>
                          {serverError.includes('تسجيل الدخول') || serverError.includes('401') ? (
                            <button
                              type="button"
                              onClick={() => navigate('/login')}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#051838] text-white rounded-xl text-xs font-bold hover:bg-[#072454] transition-colors cursor-pointer"
                            >
                              الانتقال لتسجيل الدخول
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={fetchCollections}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>إعادة المحاولة</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm font-cairo">
                            لا توجد سجلات تحصيل مسجلة على الخادم
                          </p>
                          <p className="text-xs text-slate-400 font-cairo text-center leading-relaxed">
                            لم يتم تسجيل أي عمليات تحصيل أو سندات قبض في قاعدة البيانات حتى الآن. عند تسجيل أول دفعة من قسم العملاء أو الفواتير، ستظهر بياناتها هنا مباشرة.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#007a3d] hover:bg-[#009148] rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>عرض العملاء وتسجيل دفعة جديدة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Receipt Number */}
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#051838]">
                          {item.receiptNumber || item.id}
                        </td>

                        {/* Customer Name */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.customerName}
                        </td>

                        {/* Collected Amount */}
                        <td className="px-6 py-4 font-bold font-cairo text-[#047857]">
                          {item.amount.toLocaleString('ar-SA')}{' '}
                          <span className="text-xs font-normal text-slate-500">ش.إ</span>
                        </td>

                        {/* Payment Date */}
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {item.date}
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {formatPaymentMethod(item.paymentMethod)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{item.status || 'مكتمل'}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#051838] bg-slate-100 hover:bg-[#051838] hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="عرض سند القبض الإلكتروني"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>عرض السند</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                عرض {filteredCollections.length} من إجمالي {reportData?.totalRecords || filteredCollections.length} سجل
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1 || isLoading}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="px-2 font-semibold text-slate-700">
                  صفحة {pageNumber}
                </span>

                <button
                  type="button"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={filteredCollections.length < pageSize || isLoading}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
      </div>
    </div>
  );
};

export default ReportsScreen;
