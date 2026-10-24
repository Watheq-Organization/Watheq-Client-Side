import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  History,
  Calendar,
  Building2,
  Search,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ArrowRightLeft,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { ApiError } from '../../api/httpClient';
import {
  getReconciliationHistory,
  getReconciliationSummary,
  getReconciliationTransactions,
  approveMatchedTransaction,
  convertSaleToDebt,
  formatBankName,
  normalizeClassification,
  getClassificationMeta,
  getApprovalStatusMeta,
} from '../../services/mizanService';
import type {
  ReconciliationSummary,
  HistoricalReconciliationSession,
  MizanTransactionDto,
} from '../../services/mizanService';
import { CreateSaleConfirmModal, type DepositSaleCandidate } from './CreateSaleConfirmModal';

export interface MizanHistoryAuditLogProps {
  onOpenSessionInStudio?: (sessionId: string, bankName: string) => void;
  onRefreshParentCount?: (count: number) => void;
}

const BANK_FILTER_OPTIONS = [
  { id: 'all', label: 'جميع البنوك والمحافظ' },
  { id: 'BankOfPalestine', label: 'بنك فلسطين' },
  { id: 'BankOfAlQuds', label: 'بنك القدس' },
  { id: 'PalestineIslamicBank', label: 'البنك الإسلامي الفلسطيني' },
  { id: 'ArabBank', label: 'البنك العربي' },
  { id: 'TheNationalBank', label: 'البنك الوطني' },
  { id: 'PalPay', label: 'PalPay' },
  { id: 'JawwalPay', label: 'جوال باي' },
];

export const MizanHistoryAuditLog: FC<MizanHistoryAuditLogProps> = ({
  onOpenSessionInStudio,
  onRefreshParentCount,
}) => {
  const [sessions, setSessions] = useState<HistoricalReconciliationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side query parameter states (page >= 1, pageSize 10-100)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Error States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNoBusinessError, setIsNoBusinessError] = useState(false);

  // Active Session Audit Modal States
  const [auditSession, setAuditSession] = useState<HistoricalReconciliationSession | null>(null);
  const [auditSummary, setAuditSummary] = useState<ReconciliationSummary | null>(null);
  const [auditTransactions, setAuditTransactions] = useState<MizanTransactionDto[]>([]);
  const [isLoadingAuditDetails, setIsLoadingAuditDetails] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditTab, setAuditTab] = useState<'all' | 'Matched' | 'NeedsReview' | 'Uncollected' | 'DepositWithoutInvoice'>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalToastMsg, setModalToastMsg] = useState<string | null>(null);

  // Create Sale Dialog candidate inside modal
  const [candidateDeposit, setCandidateDeposit] = useState<DepositSaleCandidate | null>(null);
  const [isCreateSaleModalOpen, setIsCreateSaleModalOpen] = useState(false);

  // Fetch past sessions from backend in effect (Contract: GET /api/Mizan/reconciliations)
  useEffect(() => {
    let isMounted = true;

    // Validate fromDate <= toDate before sending query
    if (fromDate && toDate && fromDate > toDate) {
      return;
    }

    const params: {
      page: number;
      pageSize: number;
      bankName?: string;
      fromDate?: string;
      toDate?: string;
      search?: string;
    } = {
      page: Math.max(1, currentPage),
      pageSize: Math.max(1, Math.min(100, pageSize)),
    };

    if (selectedBank && selectedBank !== 'all') {
      params.bankName = selectedBank;
    }

    if (fromDate?.trim()) {
      params.fromDate = fromDate.trim();
    }

    if (toDate?.trim()) {
      params.toDate = toDate.trim();
    }

    if (searchQuery?.trim()) {
      params.search = searchQuery.trim();
    }

    getReconciliationHistory(params)
      .then((paginatedResult) => {
        if (isMounted) {
          setSessions(paginatedResult.items);
          setTotalCount(paginatedResult.totalCount);
          setTotalPages(paginatedResult.totalPages || 1);
          setErrorMessage(null);
          setIsNoBusinessError(false);
          setIsLoading(false);
          setIsRefreshing(false);
          if (onRefreshParentCount) {
            onRefreshParentCount(paginatedResult.totalCount);
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError) {
            if (err.status === 404) {
              setIsNoBusinessError(true);
              setErrorMessage(
                'لا يوجد نشاط تجاري مرتبط بالحساب الحالي. يرجى استكمال بيانات ملف التاجر أولاً.'
              );
            } else if (err.status === 400) {
              const bodyMsg = (err.body as { message?: string })?.message;
              setErrorMessage(bodyMsg || 'خطأ في معايير البحث والتواريخ المرسلة.');
            } else {
              setErrorMessage('تعذر جلب سجل المطابقات من الخادم. يرجى المحاولة لاحقاً.');
            }
          } else {
            setErrorMessage('تعذر الاتصال بالخادم.');
          }
          setSessions([]);
          setTotalCount(0);
          setTotalPages(1);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize, selectedBank, fromDate, toDate, searchQuery, onRefreshParentCount, refreshCounter]);

  // Handle Quick Date Range Pill clicks
  const handleDateRangePill = (range: 'all' | 'today' | '7days' | '30days') => {
    setDateRangeFilter(range);
    setCurrentPage(1);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (range === 'all') {
      setFromDate('');
      setToDate('');
    } else if (range === 'today') {
      const todayStr = formatDate(today);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (range === '7days') {
      const past = new Date(today.getTime() - 7 * 86400000);
      setFromDate(formatDate(past));
      setToDate(formatDate(today));
    } else if (range === '30days') {
      const past = new Date(today.getTime() - 30 * 86400000);
      setFromDate(formatDate(past));
      setToDate(formatDate(today));
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshCounter((c) => c + 1);
  };

  // Open detailed session audit log
  const handleInspectSession = async (session: HistoricalReconciliationSession) => {
    setAuditSession(session);
    setIsLoadingAuditDetails(true);
    setAuditSearchQuery('');
    setAuditTab('all');
    setModalToastMsg(null);

    try {
      // 1. Fetch summary
      const summary = await getReconciliationSummary(session.id || session.sessionId || '');
      setAuditSummary(summary);

      // 2. Fetch transactions (server-side with pageSize 100 for audit review)
      const res = await getReconciliationTransactions(session.id || session.sessionId || '', {
        pageSize: 100,
      });
      setAuditTransactions(res.items);
    } catch {
      // Graceful fallback to session data
    } finally {
      setIsLoadingAuditDetails(false);
    }
  };

  // Copy reference number to clipboard
  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Inside Modal: Approve Matched
  const handleModalApprove = async (transactionId: string) => {
    setActionLoadingId(`approve-${transactionId}`);
    try {
      await approveMatchedTransaction(transactionId);
      setModalToastMsg('تم اعتماد المعاملة بنجاح.');
      if (auditSession) {
        const id = auditSession.id || auditSession.sessionId || '';
        const summary = await getReconciliationSummary(id);
        setAuditSummary(summary);
        const res = await getReconciliationTransactions(id, { pageSize: 100 });
        setAuditTransactions(res.items);
      }
    } catch {
      setModalToastMsg('تعذر اعتماد المعاملة.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Inside Modal: Convert Sale to Debt
  const handleModalConvertToDebt = async (saleId: string) => {
    if (!window.confirm('هل تريد تحويل هذه الفاتورة إلى دين على العميل؟')) return;
    setActionLoadingId(`debt-${saleId}`);
    try {
      const res = await convertSaleToDebt(saleId);
      const debtNumber = res.debtNumber || (res.data?.debtNumber ? String(res.data.debtNumber) : '');
      const amount = res.amount || res.data?.amount || 0;
      setModalToastMsg(`تم تحويل المبيعة إلى ذمة مالية بنجاح${debtNumber ? ` (رقم الدين: ${debtNumber}${amount ? `، المبلغ: ${amount} ₪` : ''})` : ''}`);
      if (auditSession) {
        const id = auditSession.id || auditSession.sessionId || '';
        const summary = await getReconciliationSummary(id);
        setAuditSummary(summary);
        const trans = await getReconciliationTransactions(id, { pageSize: 100 });
        setAuditTransactions(trans.items);
      }
    } catch {
      setModalToastMsg('تعذر تحويل المبيعة إلى دين.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Inside Modal: Open Create Sale Confirmation Dialog
  const handleModalOpenCreateSale = (t: MizanTransactionDto) => {
    const rawSender = t.senderNameRaw || t.senderNameNormalized || t.bankSenderName || 'Unknown Deposit';
    const ref = t.referenceNumber || t.bankReferenceNumber || '—';
    const dateFormatted = t.transactionDate ? new Date(t.transactionDate).toLocaleString('ar-EG') : 'اليوم';

    setCandidateDeposit({
      id: String(t.id),
      bankAmount: Number(t.bankAmount ?? t.amount ?? 0),
      bankSenderName: rawSender,
      bankReferenceNumber: ref,
      transactionDate: dateFormatted,
    });
    setIsCreateSaleModalOpen(true);
  };

  // Overall Statistics across sessions
  const stats = {
    totalSessions: totalCount,
    totalTransactions: sessions.reduce((acc, s) => acc + (s.totalTransactions || 0), 0),
    totalMatched: sessions.reduce((acc, s) => acc + (s.matchedCount || 0), 0),
    totalDiscrepancies: sessions.reduce((acc, s) => acc + (s.discrepanciesCount || 0), 0),
    totalVolume: sessions.reduce((acc, s) => acc + (s.totalAmount || 0), 0),
  };

  // Filtered audit transactions in active modal
  const filteredAuditTransactions = auditTransactions.filter((t) => {
    const norm = normalizeClassification(t.classification);
    const matchesTab = auditTab === 'all' || norm === auditTab;

    const q = auditSearchQuery.trim().toLowerCase();
    const sender = (t.senderNameRaw || t.senderNameNormalized || t.bankSenderName || '').toLowerCase();
    const ref = (t.referenceNumber || t.bankReferenceNumber || '').toLowerCase();
    const amountStr = String(t.amount || t.bankAmount || '');
    const matchesSearch = !q || sender.includes(q) || ref.includes(q) || amountStr.includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Create Sale Confirm Modal inside Audit View */}
      <CreateSaleConfirmModal
        isOpen={isCreateSaleModalOpen}
        onClose={() => {
          setIsCreateSaleModalOpen(false);
          setCandidateDeposit(null);
        }}
        deposit={candidateDeposit}
        onSuccess={(msg) => {
          setModalToastMsg(msg);
          if (auditSession) {
            const id = auditSession.id || auditSession.sessionId || '';
            getReconciliationSummary(id).then(setAuditSummary).catch(() => {});
            getReconciliationTransactions(id, { pageSize: 100 })
              .then((res) => setAuditTransactions(res.items))
              .catch(() => {});
          }
          handleManualRefresh();
        }}
        onRefreshData={() => {
          if (auditSession) {
            const id = auditSession.id || auditSession.sessionId || '';
            getReconciliationTransactions(id, { pageSize: 100 })
              .then((res) => setAuditTransactions(res.items))
              .catch(() => {});
          }
        }}
      />

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 to-[#051838] text-white p-6 rounded-3xl shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>نظام ميزان — سجل الأرشيف والتدقيق المالي</span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            أرشيف كشوفات الحساب والمطابقات السابقة
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            استعرض كشوفات البنوك والمحافظ الإلكترونية التي تم رفعها وتدقيقها سابقاً، راجع الحوالات المطابقة والمتنازع عليها، وابحث بالاسم أو الرقم المرجعي أو اطبع ملخص التدقيق.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث السجل</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">إجمالي الجلسات المؤرشفة</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalSessions}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>جلسة مطابقة في السجل</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">العمليات البنكية بالصفحة</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalTransactions.toLocaleString()}</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 font-medium">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>حركة إيداع ومطابقة</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-teal-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">المطابقة التامة</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalMatched}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>عملية معتمدة 100%</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">إجمالي المبالغ المدققة</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats.totalVolume.toLocaleString()} <span className="text-xs font-normal text-slate-400">₪</span>
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.totalDiscrepancies} فروقات مسجلة</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box (Searches in FileName or ErrorMessage) */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث باسم الملف، الرقم المرجعي، أو الملاحظات..."
              className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bank Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {BANK_FILTER_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">عدد النتائج:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Date Filter Quick Pills & Date Inputs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-2">
            <Calendar className="w-3.5 h-3.5" />
            الفترة الزمنية:
          </span>

          <button
            onClick={() => handleDateRangePill('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateRangeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            كل الأوقات
          </button>
          <button
            onClick={() => handleDateRangePill('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateRangeFilter === 'today'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => handleDateRangePill('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateRangeFilter === '7days'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => handleDateRangePill('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateRangeFilter === '30days'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            آخر 30 يوماً
          </button>

          {/* Custom Date Inputs (ISO 8601 strings: YYYY-MM-DD) */}
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs text-slate-400">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
                setDateRangeFilter('custom');
              }}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
            />
            <span className="text-xs text-slate-400">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
                setDateRangeFilter('custom');
              }}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Date Validation Alert if user set fromDate > toDate */}
        {fromDate && toDate && fromDate > toDate && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>تنبيه: تاريخ البدء ({fromDate}) يجب أن يكون سابقاً أو مطابقاً لتاريخ الانتهاء ({toDate}).</span>
          </div>
        )}
      </div>

      {/* Error Banner if 404 No Business or 400 Bad Request */}
      {errorMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border ${
            isNoBusinessError
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{errorMessage}</p>
            {isNoBusinessError && (
              <p className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                يمكنك التوجه إلى إعدادات ملف التاجر لربط نشاطك التجاري وتفعيل ميزة مطابقة كشوف الحسابات البنكية.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sessions Archive Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">سجلات كشوفات الحساب المؤرشفة</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {totalCount} كشف
            </span>
          </div>

          <p className="text-xs text-slate-400 hidden sm:block">
            اضغط على &quot;تدقيق العمليات&quot; لعرض تفاصيل الكشف كاملة وإدارة الحوالات
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">جاري تحميل سجل وأرشيف ميزان من الخادم...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <History className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                لا توجد عمليات تسوية بنكية تطابق معايير البحث.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                جرب تغيير معايير البحث أو اختيار فترة زمنية أخرى، أو ابدأ برفع كشف حساب جديد في شاشة المطابقة.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">معرف الجلسة والكشف</th>
                    <th className="px-6 py-4">البنك / المحفظة</th>
                    <th className="px-6 py-4">فترة الكشف المسجلة</th>
                    <th className="px-6 py-4 text-center">إجمالي العمليات</th>
                    <th className="px-6 py-4 text-center">المطابقة (100%)</th>
                    <th className="px-6 py-4 text-center">فروقات تحتاج مراجعة</th>
                    <th className="px-6 py-4">إجمالي المبلغ</th>
                    <th className="px-6 py-4">حالة التدقيق</th>
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {sessions.map((session) => {
                    const sessionId = session.id || session.sessionId || '';
                    const arabicBankName = formatBankName(session.bankName);
                    // Render statementPeriod directly as returned by Backend
                    const displayPeriod = session.statementPeriod || session.period || session.periodName || '—';
                    const fileName = session.fileName || session.statementFileName || 'كشف_حساب.xlsx';
                    const matchPercent =
                      session.totalTransactions > 0
                        ? Math.round((session.matchedCount / session.totalTransactions) * 100)
                        : 100;

                    return (
                      <tr
                        key={sessionId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        {/* Session ID & File */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                                {sessionId}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] block" title={fileName}>
                                {fileName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Bank Name (Mapped to Arabic) */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {arabicBankName}
                          </span>
                        </td>

                        {/* Statement Period Displayed directly as returned by Backend */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">
                            {displayPeriod}
                          </div>
                          {session.createdAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              رُفع بتاريخ: {new Date(session.createdAt).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </td>

                        {/* Total Operations */}
                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {session.totalTransactions}
                        </td>

                        {/* Matched Count */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{session.matchedCount}</span>
                            <span className="text-[10px] opacity-75 font-mono">({matchPercent}%)</span>
                          </div>
                        </td>

                        {/* Discrepancies Count */}
                        <td className="px-6 py-4 text-center">
                          {session.discrepanciesCount > 0 ? (
                            <div className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{session.discrepanciesCount} فارق</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Total Amount in ILS ₪ */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {(session.totalAmount || 0).toLocaleString()} <span className="font-sans text-slate-400">₪</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {session.discrepanciesCount === 0 && session.uncollectedCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              معتمدة بالكامل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              تحتاج تدقيق
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleInspectSession(session)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
                              title="عرض وتدقيق تفاصيل الحركات"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>تدقيق العمليات</span>
                            </button>

                            {onOpenSessionInStudio && (
                              <button
                                onClick={() => onOpenSessionInStudio(sessionId, session.bankName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                                title="فتح في شاشة المطابقة الحية"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">فتح في ميزان</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  صفحة {currentPage} من {totalPages} (إجمالي {totalCount} كشف حساب)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <span className="text-xs font-mono font-bold px-2 text-slate-800 dark:text-slate-200">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DETAILED SESSION AUDIT & TRANSACTION INSPECTION MODAL                      */}
      {/* ========================================================================= */}
      {auditSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-850">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-md">
                    {auditSession.id || auditSession.sessionId}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    {formatBankName(auditSession.bankName)}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    فترة: {auditSession.statementPeriod || auditSession.period || '—'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  تقرير التدقيق المحاسبي وسجل المعاملات البنكية
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>طباعة التقرير</span>
                </button>

                {onOpenSessionInStudio && (
                  <button
                    onClick={() => {
                      onOpenSessionInStudio(auditSession.id || auditSession.sessionId || '', auditSession.bankName);
                      setAuditSession(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>متابعة الاعتماد في ميزان</span>
                  </button>
                )}

                <button
                  onClick={() => setAuditSession(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {modalToastMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{modalToastMsg}</span>
                </div>
              )}

              {/* Session KPI Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                    إجمالي الحركات البنكية
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {auditSummary?.totalBankTransactions ?? auditSession.totalTransactions}
                  </span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    مطابقة تامة (100%)
                  </span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {auditSummary?.matched ?? auditSession.matchedCount}
                  </span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block mb-0.5">
                    فروقات مسجلة
                  </span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                    {auditSummary?.needsReview ?? auditSummary?.discrepancies ?? auditSession.discrepanciesCount}
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/40 text-center">
                  <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 block mb-0.5">
                    إجمالي مبالغ الكشف
                  </span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono">
                    {(auditSession.totalAmount || 0).toLocaleString()} ₪
                  </span>
                </div>
              </div>

              {/* Transaction Search & Filter Tabs */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => setAuditTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        auditTab === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      جميع الحركات ({auditTransactions.length})
                    </button>
                    <button
                      onClick={() => setAuditTab('Matched')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        auditTab === 'Matched'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      مطابق
                    </button>
                    <button
                      onClick={() => setAuditTab('NeedsReview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        auditTab === 'NeedsReview'
                          ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      تحتاج مراجعة
                    </button>
                    <button
                      onClick={() => setAuditTab('DepositWithoutInvoice')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        auditTab === 'DepositWithoutInvoice'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      إيداعات بدون فواتير
                    </button>
                  </div>

                  {/* Search within Session */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder="بحث بالاسم، المبلغ، أو المرجع..."
                      className="w-full pl-3 pr-9 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Audit Transactions Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                  {isLoadingAuditDetails ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                      <p className="text-xs text-slate-500">جاري قراءة سجل الحركات من الخادم...</p>
                    </div>
                  ) : filteredAuditTransactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      لا توجد حركات تطابق معايير البحث الحالية داخل هذه الجلسة.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3">رقم العملية / المرجع</th>
                            <th className="px-4 py-3">اسم المودع / العميل</th>
                            <th className="px-4 py-3">المبلغ (₪)</th>
                            <th className="px-4 py-3">التوقيت</th>
                            <th className="px-4 py-3">تصنيف التدقيق</th>
                            <th className="px-4 py-3 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                          {filteredAuditTransactions.map((item) => {
                            const meta = getClassificationMeta(item.classification);
                            const approvalMeta = getApprovalStatusMeta(item.approvalStatus);
                            const ref = item.referenceNumber || item.bankReferenceNumber || '—';
                            const sender = item.senderNameRaw || item.senderNameNormalized || item.bankSenderName || 'غير متوفر';
                            const amount = Number(item.bankAmount ?? item.amount ?? 0);
                            const timeStr = item.transactionDate ? new Date(item.transactionDate).toLocaleString('ar-EG') : '—';

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40">
                                <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span>{ref}</span>
                                    <button
                                      onClick={() => handleCopyRef(ref)}
                                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                                      title="نسخ الرقم المرجعي"
                                    >
                                      {copiedRef === ref ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                  {sender}
                                </td>
                                <td className="px-4 py-3 font-black text-slate-900 dark:text-white font-mono">
                                  {amount.toLocaleString()} ₪
                                </td>
                                <td className="px-4 py-3 text-slate-500 font-medium">{timeStr}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeClass}`}>
                                      {meta.label}
                                    </span>
                                    {item.approvalStatus && (
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${approvalMeta.badgeClass}`}>
                                        {approvalMeta.label}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Action: Create Sale (Allowed ONLY on DepositWithoutInvoice/Unclaimed or NeedsReview/Review) */}
                                    {meta.canCreateSale && (
                                      <button
                                        type="button"
                                        onClick={() => handleModalOpenCreateSale(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all shadow-xs"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        <span>إنشاء مبيعة</span>
                                      </button>
                                    )}

                                    {/* Action: Convert Uncollected to Debt */}
                                    {meta.canConvertToDebt && (
                                      <button
                                        type="button"
                                        onClick={() => handleModalConvertToDebt(item.saleId || String(item.id))}
                                        disabled={actionLoadingId === `debt-${item.saleId || item.id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold text-[10px] transition-all"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>تحويل لدين ⚠️</span>
                                      </button>
                                    )}

                                    {/* Action: Approve Matched */}
                                    {meta.canApprove && (
                                      <button
                                        type="button"
                                        onClick={() => handleModalApprove(String(item.id))}
                                        disabled={actionLoadingId === `approve-${item.id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium text-[10px] transition-all"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>اعتماد</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                منظومة ميزان — منصة وثّق لإدارة الديون ونقاط البيع
              </span>
              <button
                onClick={() => setAuditSession(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                إغلاق نافذة التدقيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MizanHistoryAuditLog;
