import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent, DragEvent, FC } from 'react';
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
  AlertCircle,
  History,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Toast } from '../ui/Toast';
import { MizanHistoryAuditLog } from './MizanHistoryAuditLog';
import { CreateSaleConfirmModal, type DepositSaleCandidate } from './CreateSaleConfirmModal';
import { 
  uploadAndStartReconciliation,
  getReconciliationSummary,
  getReconciliationTransactions,
  approveMatchedTransaction,
  convertSaleToDebt,
  formatBankName,
  getClassificationMeta,
  getApprovalStatusMeta
} from '../../services/mizanService';
import type {
  ReconciliationSummary,
  MizanTransactionDto
} from '../../services/mizanService';

const BANK_OPTIONS = [
  { id: 'BankOfPalestine', label: 'بنك فلسطين' },
  { id: 'BankOfAlQuds', label: 'بنك القدس' },
  { id: 'PalestineIslamicBank', label: 'البنك الإسلامي الفلسطيني' },
  { id: 'ArabBank', label: 'البنك العربي' },
  { id: 'TheNationalBank', label: 'البنك الوطني' },
  { id: 'PalPay', label: 'PalPay' },
  { id: 'JawwalPay', label: 'جوال باي' }
];

const PERIOD_OPTIONS = [
  { id: 'Today', label: 'اليوم' },
  { id: 'Last2Hours', label: 'آخر ساعتين' },
  { id: 'Yesterday', label: 'أمس' },
  { id: 'Last48Hours', label: 'آخر 48 ساعة' },
  { id: 'ThisWeek', label: 'هذا الأسبوع' }
];

export const MizanReconciliation: FC = () => {
  const [mainView, setMainView] = useState<'studio' | 'history'>('studio');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'reconciled' | 'uncollected' | 'discrepancies' | 'unmatched'>('reconciled');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingAsync, setIsProcessingAsync] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBankKey, setSelectedBankKey] = useState('BankOfPalestine');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalBankTransactions: 0,
    matched: 0,
    needsReview: 0,
    unclaimedDeposits: 0,
    missingInBank: 0,
    discrepancies: 0,
    finalApproved: 0,
    totalAmount: 0,
    matchedAmount: 0
  });

  // Table pagination and search states per tab
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [tabTotalCount, setTabTotalCount] = useState(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Raw current list of items for the active tab
  const [transactionsList, setTransactionsList] = useState<MizanTransactionDto[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  
  const [selectedPeriodKey, setSelectedPeriodKey] = useState('Today');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // Create Sale Dialog state
  const [candidateDeposit, setCandidateDeposit] = useState<DepositSaleCandidate | null>(null);
  const [isCreateSaleModalOpen, setIsCreateSaleModalOpen] = useState(false);

  // Convert tab to backend status filter
  const getTabStatusParam = (tab: 'reconciled' | 'uncollected' | 'discrepancies' | 'unmatched'): string => {
    switch (tab) {
      case 'reconciled':
        return 'Matched';
      case 'uncollected':
        return 'Uncollected';
      case 'discrepancies':
        return 'NeedsReview';
      case 'unmatched':
        return 'DepositWithoutInvoice';
      default:
        return '';
    }
  };

  const triggerRefresh = useCallback(() => {
    setIsLoadingTransactions(true);
    setRefreshCounter(c => c + 1);
  }, []);

  // Fetch summary and tab transactions in effect
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    const statusParam = getTabStatusParam(activeTab);
    Promise.all([
      getReconciliationSummary(sessionId),
      getReconciliationTransactions(sessionId, {
        status: statusParam,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        pageSize
      })
    ])
      .then(([summaryData, res]) => {
        if (isMounted) {
          setSummary(summaryData);
          setTransactionsList(res.items);
          setTotalPages(res.totalPages || 1);
          setTabTotalCount(res.totalCount || res.items.length);
          setIsLoadingTransactions(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setToastMsg('فشل في جلب أحدث بيانات المطابقة من الخادم');
          setIsLoadingTransactions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, activeTab, currentPage, pageSize, searchQuery, refreshCounter]);

  // Reset page when tab or search changes
  const handleTabChange = (tab: 'reconciled' | 'uncollected' | 'discrepancies' | 'unmatched') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedTransactionIds([]);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Approve Matched Transactions (No Request Body)
  const handleApproveSelected = async () => {
    if (selectedTransactionIds.length === 0) return;
    setLoadingAction('approve-selected');
    try {
      for (const id of selectedTransactionIds) {
        await approveMatchedTransaction(id);
      }
      setToastMsg(`تم اعتماد ${selectedTransactionIds.length} معاملة بنجاح وتأكيد الإقفال.`);
      setSelectedTransactionIds([]);
      if (sessionId) {
        triggerRefresh();
      }
    } catch {
      setToastMsg('تعذر اعتماد المعاملات المحددة.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveSingle = async (transactionId: string) => {
    setLoadingAction(`approve-${transactionId}`);
    try {
      await approveMatchedTransaction(transactionId);
      setToastMsg('تم اعتماد المعاملة وتأكيد المطابقة بنجاح.');
      if (sessionId) {
        triggerRefresh();
      }
    } catch {
      setToastMsg('تعذر اعتماد المعاملة.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Convert Uncollected Sale to Debt (No Request Body)
  const handleConvertToDebt = async (saleId: string) => {
    if (!window.confirm('هل أنت متأكد من تحويل هذه الفاتورة غير المحصلة إلى ذمة مالية (دين) على العميل؟')) {
      return;
    }

    setLoadingAction(`debt-${saleId}`);
    try {
      const result = await convertSaleToDebt(saleId);
      const debtNumber = result.debtNumber || (result.data?.debtNumber ? String(result.data.debtNumber) : '');
      const amount = result.amount || result.data?.amount || 0;
      
      const detailsMsg = debtNumber 
        ? ` (رقم الدين: ${debtNumber}${amount ? `، المبلغ: ${amount} ₪` : ''})` 
        : '';

      setToastMsg(`تم تحويل المبيعة إلى ذمة مالية بنجاح${detailsMsg}`);
      if (sessionId) {
        triggerRefresh();
      }
    } catch {
      setToastMsg('تعذر تحويل المبيعة إلى دين.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Open Create Sale Confirmation Dialog
  const handleOpenCreateSaleDialog = (t: MizanTransactionDto) => {
    const rawSender = t.senderNameRaw || t.senderNameNormalized || t.bankSenderName || 'Unknown Deposit';
    const ref = t.referenceNumber || t.bankReferenceNumber || '—';
    const dateFormatted = t.transactionDate ? new Date(t.transactionDate).toLocaleString('ar-EG') : 'اليوم';

    setCandidateDeposit({
      id: String(t.id),
      bankAmount: Number(t.bankAmount ?? t.amount ?? 0),
      bankSenderName: rawSender,
      bankReferenceNumber: ref,
      transactionDate: dateFormatted
    });
    setIsCreateSaleModalOpen(true);
  };

  // Upload Process
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setIsProcessingAsync(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankName', selectedBankKey);
      formData.append('period', selectedPeriodKey);

      // POST /api/mizan/reconciliations?period=Today
      const res = await uploadAndStartReconciliation(formData, selectedPeriodKey, selectedBankKey);
      setSessionId(res.sessionId);
      setIsParsed(true);

      if (res.status === 'Queued' || res.status === 'Processing') {
        setIsProcessingAsync(true);
        setToastMsg('تم إدراج كشف الحساب في طابور المعالجة الآلية (Queued). جاري التحليل...');
      } else {
        setToastMsg('تم رفع كشف الحساب وبدء المطابقة بنجاح.');
      }

      triggerRefresh();
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 401) {
        window.location.href = '/login';
      } else {
        setToastMsg('تعذر معالجة الملف، يرجى التأكد من صيغة الملف والمحاولة مجدداً.');
      }
    } finally {
      setIsUploading(false);
      setIsProcessingAsync(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
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

  const currentBankLabel = formatBankName(selectedBankKey);
  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.id === selectedPeriodKey)?.label || 'اليوم';

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex" dir="rtl">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Confirmation Modal for Creating Instant Sale with NO inputs */}
      <CreateSaleConfirmModal
        isOpen={isCreateSaleModalOpen}
        onClose={() => {
          setIsCreateSaleModalOpen(false);
          setCandidateDeposit(null);
        }}
        deposit={candidateDeposit}
        onSuccess={(msg) => {
          setToastMsg(msg);
          if (sessionId) {
            triggerRefresh();
          }
        }}
        onRefreshData={() => {
          if (sessionId) {
            triggerRefresh();
          }
        }}
      />
      
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
          searchPlaceholder="البحث في المنظومة..."
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
                ميزان — مطابقة المبيعات الفورية مع كشف البنك
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                تأكد من دخول جميع مبيعاتك الفورية إلى حساباتك البنكية والمحافظ الإلكترونية بدقة متناهية
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setMainView('studio')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainView === 'studio'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>مطابقة كشف جديد</span>
              </button>

              <button
                onClick={() => setMainView('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mainView === 'history'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>سجل وأرشيف المطابقات</span>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    {historyCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {mainView === 'history' ? (
            <MizanHistoryAuditLog
              onOpenSessionInStudio={(sessId, bank) => {
                setSelectedBankKey(bank);
                setSessionId(sessId);
                setIsParsed(true);
                triggerRefresh();
                setMainView('studio');
                setToastMsg(`تم فتح جلسة المطابقة (${sessId}) بنجاح`);
              }}
              onRefreshParentCount={setHistoryCount}
            />
          ) : (
            <>
              {/* Period and Bank Filter Header */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  {/* Period Selector */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                      onBlur={() => setTimeout(() => setIsPeriodDropdownOpen(false), 200)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        فترة المطابقة: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{currentPeriodLabel}</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPeriodDropdownOpen && (
                      <div 
                        className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-20"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {PERIOD_OPTIONS.map(period => (
                          <button
                            key={period.id}
                            onClick={() => {
                              setSelectedPeriodKey(period.id);
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-right px-4 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              selectedPeriodKey === period.id 
                                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 font-bold' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                  
                  {/* Bank Selector */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      onBlur={() => setTimeout(() => setIsBankDropdownOpen(false), 200)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentBankLabel}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isBankDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-20"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {BANK_OPTIONS.map(bank => (
                          <button
                            key={bank.id}
                            onClick={() => {
                              setSelectedBankKey(bank.id);
                              setIsBankDropdownOpen(false);
                            }}
                            className={`w-full text-right px-4 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              selectedBankKey === bank.id 
                                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 font-bold' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {bank.label}
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
                  className={`bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed p-10 text-center mb-6 transition-all cursor-pointer group ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/40 shadow-lg' 
                      : 'border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
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
                    <div className="flex flex-col items-center justify-center animate-pulse py-4">
                      <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">جاري المعالجة والمطابقة الآلية...</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs">
                        {isProcessingAsync 
                          ? 'الكشف قيد المعالجة (Queued Processing) — جاري قراءة الحوالات وربطها بالمبيعات'
                          : 'جاري سحب حركات الإيداع ومطابقتها مع مبيعات اليوم الفورية'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                        اسحب وأفلت كشف حساب {currentBankLabel} هنا
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-5 text-xs">
                        يدعم ملفات PDF, Excel (.xlsx/.xls), و CSV الخاصة بالبنوك المحلية الفلسطينية ومحافظ الدفع
                      </p>
                      <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm pointer-events-none">
                        <FileSpreadsheet className="w-4 h-4" />
                        تصفح الملفات من جهازك
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-300">تمت مطابقة الكشف بنجاح</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        كشف حساب {currentBankLabel} • الفترة: {summary.statementPeriod || currentPeriodLabel}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsParsed(false)} 
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-bold underline"
                  >
                    رفع كشف حساب آخر
                  </button>
                </div>
              )}

              {/* KPIs Section - All Amounts bound in ILS ₪ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-800"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">إجمالي الحركات البنكية</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {(summary.totalBankTransactions ?? 0).toLocaleString()}
                      </h3>
                      {summary.totalAmount ? (
                        <p className="text-xs text-slate-500 font-mono mt-1 font-semibold">
                          {summary.totalAmount.toLocaleString()} ₪
                        </p>
                      ) : null}
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">إجمالي العمليات المقروءة من الكشف</p>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mb-1">مطابقة بنكياً 🟢</p>
                      <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300">
                        {(summary.matched ?? summary.matchedCount ?? 0).toLocaleString()}
                      </h3>
                      {summary.matchedAmount ? (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono mt-1 font-semibold">
                          {summary.matchedAmount.toLocaleString()} ₪
                        </p>
                      ) : null}
                    </div>
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-3 font-medium">مبيعات تطابقت مع الكشف 100%</p>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold mb-1">تحتاج مراجعة ⚠️</p>
                      <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300">
                        {(summary.needsReview ?? summary.discrepancies ?? 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-3 font-medium">فروقات مبالغ أو عمولات بنكية</p>
                </div>

                <div className="bg-red-50/50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-200/80 dark:border-red-800/50 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-red-800 dark:text-red-400 font-semibold mb-1">مفقودة في البنك 🔴</p>
                      <h3 className="text-2xl font-black text-red-900 dark:text-red-300">
                        {(summary.missingInBank ?? 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-red-100 dark:bg-red-900/60 rounded-xl text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-3 font-medium">فواتير كاشير لم يظهر إيداع مقابلها</p>
                </div>
              </div>

              {/* Tabs Navigation & Transaction Data Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xs overflow-hidden">
                {/* Tabs Strip */}
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850">
                  <button 
                    onClick={() => handleTabChange('reconciled')}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-colors relative whitespace-nowrap ${
                      activeTab === 'reconciled' 
                        ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${activeTab === 'reconciled' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>مبيعات مطابقة تماماً</span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {summary.matched ?? summary.matchedCount ?? 0}
                    </span>
                    {activeTab === 'reconciled' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>}
                  </button>
                  
                  <button 
                    onClick={() => handleTabChange('uncollected')}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-colors relative whitespace-nowrap ${
                      activeTab === 'uncollected' 
                        ? 'text-red-700 dark:text-red-400 bg-white dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${activeTab === 'uncollected' ? 'text-red-600' : 'text-slate-400'}`} />
                    <span>مبيعات غير محصلة</span>
                    <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {summary.missingInBank ?? 0}
                    </span>
                    {activeTab === 'uncollected' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>}
                  </button>

                  <button 
                    onClick={() => handleTabChange('discrepancies')}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-colors relative whitespace-nowrap ${
                      activeTab === 'discrepancies' 
                        ? 'text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${activeTab === 'discrepancies' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span>فروقات تحتاج مراجعة</span>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {summary.needsReview ?? summary.discrepancies ?? 0}
                    </span>
                    {activeTab === 'discrepancies' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>}
                  </button>

                  <button 
                    onClick={() => handleTabChange('unmatched')}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-colors relative whitespace-nowrap ${
                      activeTab === 'unmatched' 
                        ? 'text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <HelpCircle className={`w-4 h-4 ${activeTab === 'unmatched' ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span>حوالات بدون فواتير (إيداعات غير مطالب بها)</span>
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {summary.unclaimedDeposits ?? 0}
                    </span>
                    {activeTab === 'unmatched' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
                  </button>
                </div>

                {/* Filter & Bulk Actions Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="بحث بالرقم المرجعي، الاسم، أو المبلغ..." 
                      className="pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {activeTab === 'reconciled' && (
                    <button 
                      onClick={handleApproveSelected}
                      disabled={selectedTransactionIds.length === 0 || loadingAction === 'approve-selected'}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        selectedTransactionIds.length > 0 && loadingAction !== 'approve-selected'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد وتأكيد الإقفال للمحدد ({selectedTransactionIds.length})</span>
                    </button>
                  )}
                </div>

                {/* Tab Table Body */}
                <div className="overflow-x-auto min-h-[280px]">
                  {isLoadingTransactions ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                      <p className="text-xs font-semibold text-slate-500">جاري تحميل حركات التبويب...</p>
                    </div>
                  ) : transactionsList.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {searchQuery ? 'لا توجد نتائج تطابق كلمة البحث الحالية.' : 'لا توجد حركات مسجلة تحت هذا التصنيف.'}
                      </h4>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          {activeTab === 'reconciled' && (
                            <th className="px-5 py-3 w-12 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                checked={selectedTransactionIds.length === transactionsList.length && transactionsList.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTransactionIds(transactionsList.map(t => String(t.id)));
                                  } else {
                                    setSelectedTransactionIds([]);
                                  }
                                }}
                              />
                            </th>
                          )}
                          <th className="px-5 py-3">رقم العملية / المرجع</th>
                          <th className="px-5 py-3">التوقيت والتاريخ</th>
                          <th className="px-5 py-3">المبلغ (₪)</th>
                          <th className="px-5 py-3">اسم المودع / العميل</th>
                          <th className="px-5 py-3">حالة التطابق والاعتماد</th>
                          <th className="px-5 py-3 text-center">الإجراء المطلوب</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {transactionsList.map((t) => {
                          const meta = getClassificationMeta(t.classification);
                          const approvalMeta = getApprovalStatusMeta(t.approvalStatus);
                          const isSelected = selectedTransactionIds.includes(String(t.id));
                          const senderName = t.senderNameRaw || t.senderNameNormalized || t.bankSenderName || t.customerName || 'غير متوفر';
                          const refNumber = t.referenceNumber || t.bankReferenceNumber || '—';
                          const timeStr = t.transactionDate ? new Date(t.transactionDate).toLocaleString('ar-EG') : '—';
                          const amountVal = Number(t.bankAmount ?? t.amount ?? 0);

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                              {activeTab === 'reconciled' && (
                                <td className="px-5 py-3.5 text-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTransactionIds([...selectedTransactionIds, String(t.id)]);
                                      } else {
                                        setSelectedTransactionIds(selectedTransactionIds.filter(id => id !== String(t.id)));
                                      }
                                    }}
                                  />
                                </td>
                              )}
                              
                              {/* Reference */}
                              <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                {refNumber}
                              </td>

                              {/* Time */}
                              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                                {timeStr}
                              </td>

                              {/* Amount */}
                              <td className="px-5 py-3.5 font-black text-slate-900 dark:text-white text-sm font-mono">
                                {amountVal.toLocaleString()} ₪
                              </td>

                              {/* Sender / Customer */}
                              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                                {senderName}
                              </td>

                              {/* Classification Badges */}
                              <td className="px-5 py-3.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${meta.badgeClass}`}>
                                    {meta.label}
                                  </span>
                                  {t.approvalStatus && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${approvalMeta.badgeClass}`}>
                                      {approvalMeta.label}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Action: Create Instant Sale (Allowed ONLY on DepositWithoutInvoice/Unclaimed or NeedsReview/Review) */}
                                  {meta.canCreateSale && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateSaleDialog(t)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>إنشاء مبيعة</span>
                                    </button>
                                  )}

                                  {/* Action: Convert Uncollected to Debt */}
                                  {meta.canConvertToDebt && (
                                    <button
                                      type="button"
                                      onClick={() => handleConvertToDebt(t.saleId || String(t.id))}
                                      disabled={loadingAction === `debt-${t.saleId || t.id}`}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold transition-all"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>تحويل لدين ومطالبة الزبون ⚠️</span>
                                    </button>
                                  )}

                                  {/* Action: Approve Matched or Discrepancy */}
                                  {meta.canApprove && (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveSingle(String(t.id))}
                                      disabled={loadingAction === `approve-${t.id}`}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium transition-all"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>اعتماد المطابقة</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Server Pagination Bar */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="text-xs text-slate-500">
                      صفحة {currentPage} من {totalPages} (إجمالي {tabTotalCount} حركة)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoadingTransactions}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <span className="text-xs font-mono font-bold px-2">
                        {currentPage}
                      </span>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoadingTransactions}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Button */}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير تقرير المطابقة اليومي (PDF)</span>
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MizanReconciliation;
