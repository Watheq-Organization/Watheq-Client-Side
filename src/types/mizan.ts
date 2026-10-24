export type MizanClassification =
  | 'Matched'
  | 'Uncollected'
  | 'NeedsReview'
  | 'Review'
  | 'Unclaimed'
  | 'DepositWithoutInvoice'
  | string;

export type MizanApprovalStatus = 'FinalApproved' | 'Pending' | string;

export interface ReconciliationSummary {
  period?: string;
  statementPeriod?: string;
  from?: string;
  fromDate?: string;
  to?: string;
  toDate?: string;
  totalBankTransactions?: number;
  matched?: number;
  matchedCount?: number;
  needsReview?: number;
  unclaimedDeposits?: number;
  missingInBank?: number;
  discrepancies?: number;
  finalApproved?: number;
  totalAmount?: number;
  matchedAmount?: number;
}

export interface MatchedSaleInfo {
  id?: string;
  saleId?: string;
  invoiceNumber?: string;
  amount?: number;
  customerName?: string;
}

export interface MizanTransactionDto {
  id: string;
  transactionDate: string;
  amount: number;
  bankAmount?: number;
  senderNameRaw?: string;
  senderNameNormalized?: string;
  bankSenderName?: string;
  referenceNumber?: string;
  bankReferenceNumber?: string;
  classification: MizanClassification | number;
  approvalStatus?: MizanApprovalStatus;
  matchDetails?: string | { reason?: string; [key: string]: unknown };
  matchedSales?: MatchedSaleInfo[];
  saleId?: string;
  notes?: string;
  customerName?: string;
  invoiceAmount?: number;
}

export interface ReconciliationTransactionsParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReconciliationHistoryParams {
  page?: number;
  pageSize?: number;
  bankName?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface HistoricalReconciliationSession {
  id: string;
  sessionId?: string;
  bankName: string;
  statementPeriod?: string;
  period?: string;
  periodName?: string;
  createdAt: string;
  fileName?: string;
  statementFileName?: string;
  totalTransactions: number;
  matchedCount: number;
  discrepanciesCount: number;
  uncollectedCount: number;
  unmatchedCount: number;
  totalAmount: number;
  matchedAmount: number;
  status: string;
  approvalStatus?: string;
  errorMessage?: string;
  summary?: ReconciliationSummary;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSaleResponseDto {
  isSuccess?: boolean;
  data?: boolean | unknown;
  message?: string;
  saleId?: string;
  invoiceNumber?: string;
}

export interface ConvertToDebtResponseDto {
  isSuccess?: boolean;
  debtNumber?: string;
  debtId?: string;
  amount?: number;
  message?: string;
  data?: {
    debtNumber?: string;
    debtId?: string;
    amount?: number;
  };
}

/**
 * Bank Name Mapping to Arabic Labels
 */
export const BANK_NAMES_MAP: Record<string, string> = {
  BankOfPalestine: 'بنك فلسطين',
  BankOfAlQuds: 'بنك القدس',
  PalestineIslamicBank: 'البنك الإسلامي الفلسطيني',
  ArabBank: 'البنك العربي',
  TheNationalBank: 'البنك الوطني',
  // Local Arabic fallbacks if already in Arabic:
  'بنك فلسطين': 'بنك فلسطين',
  'بنك القدس': 'بنك القدس',
  'البنك الإسلامي الفلسطيني': 'البنك الإسلامي الفلسطيني',
  'البنك العربي': 'البنك العربي',
  'البنك الوطني': 'البنك الوطني',
  PalPay: 'PalPay',
  JawwalPay: 'جوال باي',
  'جوال باي': 'جوال باي',
};

export function formatBankName(bankName?: string): string {
  if (!bankName) return 'غير محدد';
  return BANK_NAMES_MAP[bankName] || bankName;
}

/**
 * Normalizes both numeric and string backend classifications
 */
export function normalizeClassification(raw: unknown): string {
  if (typeof raw === 'number') {
    switch (raw) {
      case 1:
        return 'Matched';
      case 2:
        return 'NeedsReview';
      case 3:
        return 'Uncollected';
      case 4:
        return 'DepositWithoutInvoice';
      default:
        return `Classification_${raw}`;
    }
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'matched') return 'Matched';
    if (lower === 'uncollected') return 'Uncollected';
    if (lower === 'needsreview' || lower === 'review') return 'NeedsReview';
    if (lower === 'unclaimed' || lower === 'depositwithoutinvoice') return 'DepositWithoutInvoice';
    return trimmed;
  }
  return 'Unknown';
}

export interface ClassificationMeta {
  label: string;
  badgeClass: string;
  canCreateSale: boolean;
  canApprove: boolean;
  canConvertToDebt: boolean;
}

/**
 * Returns UI metadata (Arabic label, badge styling, allowed actions)
 */
export function getClassificationMeta(classification: unknown): ClassificationMeta {
  const norm = normalizeClassification(classification);
  switch (norm) {
    case 'Matched':
      return {
        label: 'متطابقة',
        badgeClass:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
        canCreateSale: false,
        canApprove: true,
        canConvertToDebt: false,
      };
    case 'Uncollected':
      return {
        label: 'غير محصلة',
        badgeClass:
          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800',
        canCreateSale: false,
        canApprove: false,
        canConvertToDebt: true,
      };
    case 'NeedsReview':
    case 'Review':
      return {
        label: 'تحتاج إلى مراجعة',
        badgeClass:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
        canCreateSale: true,
        canApprove: true,
        canConvertToDebt: false,
      };
    case 'Unclaimed':
    case 'DepositWithoutInvoice':
      return {
        label: 'حوالة غير مطالب بها (إيداع بدون فاتورة)',
        badgeClass:
          'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        canCreateSale: true,
        canApprove: false,
        canConvertToDebt: false,
      };
    default:
      return {
        label: norm || 'غير محدد',
        badgeClass:
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
        canCreateSale: false,
        canApprove: false,
        canConvertToDebt: false,
      };
  }
}

/**
 * Normalizes approval status
 */
export function getApprovalStatusMeta(status: unknown): { label: string; badgeClass: string } {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();
  if (lower === 'finalapproved') {
    return {
      label: 'معتمدة نهائيًا',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
    };
  }
  if (lower === 'pending') {
    return {
      label: 'بانتظار الإجراء',
      badgeClass:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
    };
  }
  return {
    label: s || 'بانتظار الإجراء',
    badgeClass:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };
}
