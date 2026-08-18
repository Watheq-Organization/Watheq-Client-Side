import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Archive, 
  FileSpreadsheet, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { INITIAL_REPORTS_LIST, FinancialReportItem } from '../data/mockReports';
import { ScreenType } from './Header';

interface FinancialReportsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({ onNavigate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [reports, setReports] = useState<FinancialReportItem[]>(INITIAL_REPORTS_LIST);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showArchive, setShowArchive] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Chart data sets based on selected period
  const weeklyChartData = [
    { label: 'الأسبوع 1', collection: 14000, debt: 11000 },
    { label: 'الأسبوع 2', collection: 22000, debt: 16000 },
    { label: 'الأسبوع 3', collection: 18000, debt: 14500 },
    { label: 'الأسبوع 4', collection: 28500, debt: 21000 },
    { label: 'الأسبوع 5', collection: 30000, debt: 26000 },
  ];

  const maxVal = 35000;
  const yAxisTicks = [30000, 25000, 20000, 15000, 10000, 5000, 0];

  const filteredReports = reports.filter((r) => {
    const matchType = selectedType === 'all' || r.type === selectedType;
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleExportAll = () => {
    showToast('جاري تجميع وإصدار كافة التقارير المالية المدمجة بصيغة PDF...');
    setTimeout(() => {
      showToast('تم تصدير ملف التقارير الشامل بنجاح!');
    }, 1500);
  };

  const handleDownloadReport = (title: string) => {
    showToast(`تم تنزيل "${title}" بنجاح.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER WITH PERIOD SELECTOR & EXPORT BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
            التقارير المالية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            نظرة شاملة على أداء التحصيل والمديونيات.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
          
          {/* Time Period Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'daily' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'weekly' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'monthly' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'yearly' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              سنوي
            </button>
          </div>

          {/* Export All PDF Button */}
          <button
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 bg-[#0b1d3a] hover:bg-[#152a4d] text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>تصدير الكل (PDF)</span>
          </button>

        </div>
      </div>

      {/* TOP 3 STAT KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card 1: Total Collections */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              إجمالي التحصيلات
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-alexandria">
                45,200
              </span>
              <span className="text-xs font-bold text-slate-500">ريال</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12% من الشهر الماضي</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Outstanding Debts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              الديون القائمة
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0b1d3a] font-alexandria">
                128,500
              </span>
              <span className="text-xs font-bold text-slate-500">ريال</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+16% زيادة مستحقات</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Overdue Clients / Checks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              الشيكات والعملاء المحصلين
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                342
              </span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <span>12 عملاء تأخير</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* CHART SECTION: TRENDS OF DEBTS & COLLECTIONS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Chart Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 font-alexandria">
            توجهات الديون والتحصيل
          </h2>

          <div className="flex items-center gap-5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-600" />
              <span className="text-slate-700">التحصيل</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#0b1d3a]" />
              <span className="text-slate-700">المديونيات المعلقة</span>
            </div>
          </div>
        </div>

        {/* Custom Responsive SVG / CSS Bar Chart */}
        <div className="relative pt-6 pb-2">
          
          {/* Chart Grid with Y-Axis */}
          <div className="flex h-64 sm:h-72">
            
            {/* Y-Axis scale numbers (RTL: right side) */}
            <div className="w-16 flex flex-col justify-between text-right text-[10px] text-slate-400 font-mono pr-2 select-none">
              {yAxisTicks.map((val) => (
                <span key={val}>{val.toLocaleString()} ريال</span>
              ))}
            </div>

            {/* Chart Area with Background Lines and Vertical Dual Bars */}
            <div className="flex-1 relative flex flex-col justify-between border-r border-b border-slate-200 mr-2">
              
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {yAxisTicks.map((val, idx) => (
                  <div 
                    key={val} 
                    className={`w-full border-b ${idx === yAxisTicks.length - 1 ? 'border-transparent' : 'border-slate-100'}`} 
                  />
                ))}
              </div>

              {/* Bars Group Container */}
              <div className="relative z-10 h-full flex items-end justify-around px-2 sm:px-6">
                {weeklyChartData.map((item, idx) => {
                  const collectionHeight = (item.collection / maxVal) * 100;
                  const debtHeight = (item.debt / maxVal) * 100;
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div 
                      key={item.label}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="flex flex-col items-center gap-2 group cursor-pointer relative"
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap animate-in zoom-in-95 duration-150">
                          <p className="font-bold text-emerald-400">التحصيل: {item.collection.toLocaleString()} ر.س</p>
                          <p className="font-bold text-slate-300">الديون: {item.debt.toLocaleString()} ر.س</p>
                        </div>
                      )}

                      {/* Dual Bars side by side */}
                      <div className="flex items-end gap-1.5 sm:gap-2.5 h-52">
                        {/* Green Collection Bar */}
                        <div 
                          style={{ height: `${collectionHeight}%` }}
                          className="w-4 sm:w-6 lg:w-8 bg-emerald-600 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                        />
                        {/* Navy Debt Bar */}
                        <div 
                          style={{ height: `${debtHeight}%` }}
                          className="w-4 sm:w-6 lg:w-8 bg-[#0b1d3a] rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-xs"
                        />
                      </div>

                      {/* X-Axis Label */}
                      <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* DETAILED REPORTS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-alexandria">
              قائمة التقارير التفصيلية
            </h3>
            <span className="text-xs text-slate-400">
              تقارير دورية تصدر آلياً بصيغ معتمدة للمحاسبة.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في التقارير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Archive Toggle Button */}
            <button
              onClick={() => {
                setShowArchive(!showArchive);
                showToast(showArchive ? 'عرض التقارير الحالية' : 'عرض أرشيف التقارير القديمة');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                showArchive 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>عرض الأرشيف</span>
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold text-[11px]">
                <th className="py-3.5 px-4">اسم التقرير</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4">نوع التقرير</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Title & Icon */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 font-alexandria block">
                          {rep.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {rep.fileSize} • {rep.format}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-medium">
                    {rep.createdDate}
                  </td>

                  {/* Type Badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${rep.typeColor}`}>
                      {rep.type}
                    </span>
                  </td>

                  {/* Status with green dot */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{rep.status}</span>
                    </span>
                  </td>

                  {/* Download Action */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDownloadReport(rep.title)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200 cursor-pointer"
                      title="تنزيل التقرير"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
