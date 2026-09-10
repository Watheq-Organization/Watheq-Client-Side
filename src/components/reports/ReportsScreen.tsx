import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import {
  Download,
  Banknote,
  CreditCard,
  Users,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  FileDown,
  X,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { getDashboardSummary } from '../../services/dashboardService';

type TimeRange = 'daily' | 'weekly' | 'monthly';

interface DetailedReport {
  id: string;
  name: string;
  createdAt: string;
  type: 'مالي' | 'ديون' | 'عملاء';
  status: 'مكتمل' | 'قيد المعالجة';
  fileSize: string;
  isArchived?: boolean;
}

const INITIAL_REPORTS: DetailedReport[] = [
  {
    id: 'rep-1',
    name: 'تقرير التحصيل الأسبوعي',
    createdAt: '15 أكتوبر 2023',
    type: 'مالي',
    status: 'مكتمل',
    fileSize: '1.4 MB',
    isArchived: false,
  },
  {
    id: 'rep-2',
    name: 'ملخص الديون المتأخرة',
    createdAt: '12 أكتوبر 2023',
    type: 'ديون',
    status: 'مكتمل',
    fileSize: '820 KB',
    isArchived: false,
  },
  {
    id: 'rep-3',
    name: 'تحليل قاعدة العملاء',
    createdAt: '10 أكتوبر 2023',
    type: 'عملاء',
    status: 'مكتمل',
    fileSize: '2.1 MB',
    isArchived: false,
  },
  {
    id: 'rep-4',
    name: 'التقرير المالي الشهري - سبتمبر',
    createdAt: '01 أكتوبر 2023',
    type: 'مالي',
    status: 'مكتمل',
    fileSize: '3.6 MB',
    isArchived: false,
  },
  // Additional archived reports
  {
    id: 'rep-5',
    name: 'تقرير التدفق النقدي - أغسطس',
    createdAt: '31 أغسطس 2023',
    type: 'مالي',
    status: 'مكتمل',
    fileSize: '4.2 MB',
    isArchived: true,
  },
  {
    id: 'rep-6',
    name: 'سجل التسويات والمدفوعات الربع سنوي',
    createdAt: '15 يوليو 2023',
    type: 'ديون',
    status: 'مكتمل',
    fileSize: '5.8 MB',
    isArchived: true,
  },
  {
    id: 'rep-7',
    name: 'تقرير تقييم المخاطر الائتمانية',
    createdAt: '01 يوليو 2023',
    type: 'عملاء',
    status: 'مكتمل',
    fileSize: '1.9 MB',
    isArchived: true,
  },
];

// Data points for the dual bar chart for each time range
const CHART_DATA: Record<
  TimeRange,
  Array<{ label: string; collections: number; debts: number }>
> = {
  weekly: [
    { label: 'الأسبوع 1', collections: 12000, debts: 8000 },
    { label: 'الأسبوع 2', collections: 19000, debts: 12000 },
    { label: 'الأسبوع 3', collections: 15000, debts: 10000 },
    { label: 'الأسبوع 4', collections: 25000, debts: 15000 },
    { label: 'الأسبوع 5', collections: 22000, debts: 18000 },
    { label: 'الأسبوع 6', collections: 30000, debts: 14000 },
  ],
  daily: [
    { label: 'السبت', collections: 6500, debts: 3200 },
    { label: 'الأحد', collections: 8200, debts: 4500 },
    { label: 'الإثنين', collections: 9100, debts: 5000 },
    { label: 'الثلاثاء', collections: 7400, debts: 6200 },
    { label: 'الأربعاء', collections: 11000, debts: 4800 },
    { label: 'الخميس', collections: 13500, debts: 7000 },
  ],
  monthly: [
    { label: 'مايو', collections: 28000, debts: 18000 },
    { label: 'يونيو', collections: 34000, debts: 22000 },
    { label: 'يوليو', collections: 31000, debts: 19000 },
    { label: 'أغسطس', collections: 39000, debts: 25000 },
    { label: 'سبتمبر', collections: 42000, debts: 21000 },
    { label: 'أكتوبر', collections: 45200, debts: 26500 },
  ],
};

const Y_AXIS_VALUES = [30000, 25000, 20000, 15000, 10000, 5000, 0];
const MAX_CHART_VALUE = 30000;

export const ReportsScreen: FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    type: 'collections' | 'debts';
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // Live summary values from backend if available, otherwise exact matching design values
  const [stats, setStats] = useState({
    collections: 45200,
    debts: 128500,
    activeCustomers: 342,
  });

  useEffect(() => {
    getDashboardSummary()
      .then((data) => {
        if (data) {
          setStats((prev) => ({
            collections: data.collectedAmount > 0 ? data.collectedAmount : prev.collections,
            debts: data.remainingAmount > 0 ? data.remainingAmount : prev.debts,
            activeCustomers: data.customersCount > 0 ? data.customersCount : prev.activeCustomers,
          }));
        }
      })
      .catch(() => {
        // Retain pixel-perfect design values
      });
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDownload = (reportName: string) => {
    showToast(`جاري تنزيل "${reportName}" بصيغة PDF...`);
  };

  const handleExportAll = () => {
    showToast('جاري إنشاء وتصدير كافة التقارير المالية (PDF)...');
  };

  // Filtered reports for the main table (non-archived by default)
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeList = INITIAL_REPORTS.filter((r) => !r.isArchived);
    if (!q) return activeList;
    return activeList.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.createdAt.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentChartData = CHART_DATA[timeRange];

  const getTypeBadgeStyles = (type: DetailedReport['type']) => {
    switch (type) {
      case 'مالي':
        return 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]';
      case 'ديون':
        return 'bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]';
      case 'عملاء':
        return 'bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]';
      default:
        return 'bg-slate-100 text-slate-700';
    }
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
          searchPlaceholder="البحث في التقارير..."
        />

        {/* Reports Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Top Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title & Subtitle */}
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold font-cairo text-slate-900 tracking-tight">
                التقارير المالية
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 font-cairo">
                نظرة شاملة على أداء التحصيل والمديونيات
              </p>
            </div>

            {/* Time Filter & Export PDF Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Range Filter Group */}
              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTimeRange('daily')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    timeRange === 'daily'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  يومي
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('weekly')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    timeRange === 'weekly'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أسبوعي
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('monthly')}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    timeRange === 'monthly'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  شهري
                </button>
              </div>

              {/* Export All PDF Button */}
              <button
                type="button"
                onClick={handleExportAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#051838] hover:bg-[#0c2b5e] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
              >
                <FileDown className="w-4 h-4" />
                <span>تصدير الكل (PDF)</span>
              </button>
            </div>
          </div>

          {/* Metric / Stat Cards (3 Top Cards) */}
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
                  <span>+ 8% عن الشهر الماضي</span>
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
                <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+ 3% زيادة مستحقات</span>
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
                  <span>عملاء فاعلون</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section: توجهات الديون والتحصيل */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
            {/* Chart Header & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-lg font-bold font-cairo text-slate-900">
                توجهات الديون والتحصيل
              </h2>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#007a3d]" />
                  <span>التحصيلات</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#051838]" />
                  <span>المديونيات الجديدة</span>
                </div>
              </div>
            </div>

            {/* Responsive Chart Container */}
            <div className="relative pt-4 pb-2">
              <div className="flex">
                {/* Y-Axis Labels */}
                <div className="w-20 sm:w-24 shrink-0 flex flex-col justify-between text-xs text-slate-400 font-medium pb-8 text-left pl-2 select-none h-64 sm:h-72">
                  {Y_AXIS_VALUES.map((val) => (
                    <span key={val} className="leading-none">
                      {val.toLocaleString('ar-SA')} شيكل
                    </span>
                  ))}
                </div>

                {/* Bars & Grid Lines Area */}
                <div className="flex-1 relative h-64 sm:h-72 border-r border-slate-200/80">
                  {/* Horizontal Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                    {Y_AXIS_VALUES.map((val) => (
                      <div
                        key={`grid-${val}`}
                        className="border-b border-slate-100 w-full"
                      />
                    ))}
                  </div>

                  {/* Columns Group */}
                  <div className="absolute inset-0 pb-8 flex items-end justify-around px-2 sm:px-6">
                    {currentChartData.map((item, idx) => {
                      const collectionsHeightPercent = Math.min(
                        100,
                        (item.collections / MAX_CHART_VALUE) * 100
                      );
                      const debtsHeightPercent = Math.min(
                        100,
                        (item.debts / MAX_CHART_VALUE) * 100
                      );

                      return (
                        <div
                          key={item.label}
                          className="flex flex-col items-center justify-end h-full flex-1 max-w-[80px]"
                        >
                          {/* Pair of bars */}
                          <div className="flex items-end gap-1 sm:gap-2 h-full justify-center w-full relative group">
                            {/* Bar 1: التحصيلات (Green) */}
                            <div
                              style={{ height: `${collectionsHeightPercent}%` }}
                              onMouseEnter={() =>
                                setHoveredBar({ index: idx, type: 'collections' })
                              }
                              onMouseLeave={() => setHoveredBar(null)}
                              className="w-3.5 sm:w-6 bg-[#007a3d] hover:bg-[#009148] rounded-t-sm transition-all duration-300 relative cursor-pointer shadow-xs"
                            >
                              {/* Hover Tooltip */}
                              {hoveredBar?.index === idx &&
                                hoveredBar?.type === 'collections' && (
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-cairo py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg z-20 pointer-events-none">
                                    تحصيلات: {item.collections.toLocaleString('ar-SA')} شيكل
                                  </div>
                                )}
                            </div>

                            {/* Bar 2: المديونيات الجديدة (Dark Navy) */}
                            <div
                              style={{ height: `${debtsHeightPercent}%` }}
                              onMouseEnter={() =>
                                setHoveredBar({ index: idx, type: 'debts' })
                              }
                              onMouseLeave={() => setHoveredBar(null)}
                              className="w-3.5 sm:w-6 bg-[#051838] hover:bg-[#0f2d5e] rounded-t-sm transition-all duration-300 relative cursor-pointer shadow-xs"
                            >
                              {/* Hover Tooltip */}
                              {hoveredBar?.index === idx && hoveredBar?.type === 'debts' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-cairo py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg z-20 pointer-events-none">
                                  ديون جديدة: {item.debts.toLocaleString('ar-SA')} شيكل
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* X-Axis Labels */}
                  <div className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-around px-2 sm:px-6">
                    {currentChartData.map((item) => (
                      <span
                        key={`x-${item.label}`}
                        className="text-xs text-slate-500 font-medium flex-1 text-center truncate"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Reports Table: قائمة التقارير التفصيلية */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Table Header with Archive Link */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold font-cairo text-slate-900">
                قائمة التقارير التفصيلية
              </h2>

              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-[#051838] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>عرض الأرشيف</span>
              </button>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs bg-slate-50/50">
                    <th className="px-6 py-4">اسم التقرير</th>
                    <th className="px-6 py-4">تاريخ الإنشاء</th>
                    <th className="px-6 py-4">نوع التقرير</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        لا توجد تقارير مطابقة لكلمة البحث &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Report Name */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {report.name}
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {report.createdAt}
                        </td>

                        {/* Report Type Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg ${getTypeBadgeStyles(
                              report.type
                            )}`}
                          >
                            {report.type}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>مكتمل</span>
                          </div>
                        </td>

                        {/* Download Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDownload(report.name)}
                            title={`تحميل ${report.name}`}
                            className="p-2 text-slate-600 hover:text-[#051838] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-cairo text-slate-900">
                  أرشيف التقارير السابقة
                </h3>
                <p className="text-xs text-slate-500">
                  سجل التقارير التاريخية المؤرشفة للفترات السابقة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {INITIAL_REPORTS.filter((r) => r.isArchived).map((archived) => (
                <div
                  key={archived.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-slate-800">
                      {archived.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{archived.createdAt}</span>
                      <span>•</span>
                      <span>{archived.fileSize}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${getTypeBadgeStyles(
                        archived.type
                      )}`}
                    >
                      {archived.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownload(archived.name)}
                      className="p-2 text-slate-600 hover:text-[#051838] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
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

export default ReportsScreen;
