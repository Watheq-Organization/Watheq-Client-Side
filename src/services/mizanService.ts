import { httpClient, api } from '../api/httpClient';
import type {
  ReconciliationSummary,
  MizanTransactionDto,
  ReconciliationTransactionsParams,
  ReconciliationHistoryParams,
  HistoricalReconciliationSession,
  PaginatedResult,
  CreateSaleResponseDto,
  ConvertToDebtResponseDto,
} from '../types/mizan';

export * from '../types/mizan';

/**
 * Defensive Response Unwrapper
 * Supports:
 *  - Standard envelope: { result: { code, message }, data: T }
 *  - Result envelope: { isSuccess: true, message: "...", data: T }
 *  - Direct data / array
 */
export function unwrapResponse<T>(res: unknown): T {
  if (res === null || res === undefined) {
    return res as T;
  }
  if (typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if ('data' in obj && obj.data !== undefined) {
      // Check for nested .data.data without overriding items
      const innerData = obj.data;
      if (
        innerData !== null &&
        typeof innerData === 'object' &&
        'data' in (innerData as Record<string, unknown>) &&
        !('items' in (innerData as Record<string, unknown>))
      ) {
        return (innerData as Record<string, unknown>).data as T;
      }
      return innerData as T;
    }
  }
  return res as T;
}

/**
 * Defensive Paginated Response Unwrapper
 * Handles both `page` and `pageNumber`, computes `totalPages = Math.ceil(totalCount / pageSize)`
 */
export function unwrapPaginatedResponse<T>(
  res: unknown,
  defaultPage = 1,
  defaultPageSize = 10
): PaginatedResult<T> {
  const unwrapped = unwrapResponse<unknown>(res);
  if (!unwrapped) {
    return { items: [], totalCount: 0, page: defaultPage, pageSize: defaultPageSize, totalPages: 1 };
  }

  // If directly an array of items
  if (Array.isArray(unwrapped)) {
    const totalCount = unwrapped.length;
    return {
      items: unwrapped as T[],
      totalCount,
      page: defaultPage,
      pageSize: defaultPageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / defaultPageSize)),
    };
  }

  const obj = unwrapped as Record<string, unknown>;
  const rawItems = obj.items ?? obj.data ?? obj.reconciliations ?? obj.transactions ?? [];
  const items: T[] = Array.isArray(rawItems) ? (rawItems as T[]) : [];

  const totalCount = Number(obj.totalCount ?? obj.TotalCount ?? obj.totalItems ?? items.length ?? 0);
  const pageSize = Number(obj.pageSize ?? obj.PageSize ?? defaultPageSize);
  const page = Number(obj.page ?? obj.pageNumber ?? obj.PageNumber ?? defaultPage);
  const totalPages = Number(
    obj.totalPages ?? obj.TotalPages ?? Math.max(1, Math.ceil(totalCount / (pageSize || 1)))
  );

  return {
    items,
    totalCount,
    page: page >= 1 ? page : 1,
    pageSize: pageSize >= 1 ? pageSize : defaultPageSize,
    totalPages: totalPages >= 1 ? totalPages : 1,
  };
}

// Backward compatibility interfaces
export interface ReconciledSale {
  id: string;
  time: string;
  amount: number;
  customerName: string;
  bankSender: string;
  ref: string;
  status: string;
  approvalStatus?: string;
  rawTransaction?: MizanTransactionDto;
}

export interface UncollectedSale {
  id: string;
  items: string;
  amount: number;
  customerInfo: string;
  status: string;
  rawTransaction?: MizanTransactionDto;
}

export interface Discrepancy {
  id: string;
  invoiceAmount: number;
  bankAmount: number;
  customerName: string;
  bankSender: string;
  issue: string;
  rawTransaction?: MizanTransactionDto;
}

export interface UnmatchedInflow {
  id?: string;
  time: string;
  amount: number;
  bankSender: string;
  ref: string;
  notes: string;
  rawTransaction?: MizanTransactionDto;
}

export interface ReconciliationTransactions {
  reconciled: ReconciledSale[];
  uncollected: UncollectedSale[];
  discrepancies: Discrepancy[];
  unmatched: UnmatchedInflow[];
}

/**
 * 1. Upload statement and start reconciliation
 * POST /api/mizan/reconciliations?period=Today (multipart/form-data)
 */
export async function uploadAndStartReconciliation(
  formData: FormData,
  period = 'Today',
  bankName?: string
): Promise<{ sessionId: string; status?: string; message?: string }> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (bankName) params.append('bankName', bankName);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await httpClient.postForm<unknown>(`/mizan/reconciliations${query}`, formData);
  const unwrapped = unwrapResponse<{ sessionId?: string; id?: string; status?: string; message?: string }>(response);

  const sessionId = unwrapped?.sessionId || unwrapped?.id || (unwrapped as unknown as string);
  return {
    sessionId: String(sessionId || ''),
    status: unwrapped?.status,
    message: unwrapped?.message,
  };
}

/**
 * 2. Get Reconciliation Summary
 * GET /api/mizan/reconciliations/{sessionId}/summary
 */
export async function getReconciliationSummary(sessionId: string): Promise<ReconciliationSummary> {
  const response = await httpClient.get<unknown>(`/mizan/reconciliations/${sessionId}/summary`);
  const data = unwrapResponse<Record<string, unknown>>(response);

  return {
    period: String(data?.period ?? data?.statementPeriod ?? ''),
    statementPeriod: String(data?.statementPeriod ?? data?.period ?? ''),
    from: String(data?.from ?? data?.fromDate ?? ''),
    fromDate: String(data?.fromDate ?? data?.from ?? ''),
    to: String(data?.to ?? data?.toDate ?? ''),
    toDate: String(data?.toDate ?? data?.to ?? ''),
    totalBankTransactions: Number(data?.totalBankTransactions ?? data?.totalTransactions ?? 0),
    matched: Number(data?.matched ?? data?.matchedCount ?? 0),
    matchedCount: Number(data?.matchedCount ?? data?.matched ?? 0),
    needsReview: Number(data?.needsReview ?? data?.discrepancies ?? 0),
    unclaimedDeposits: Number(data?.unclaimedDeposits ?? data?.depositWithoutInvoice ?? 0),
    missingInBank: Number(data?.missingInBank ?? data?.uncollected ?? 0),
    discrepancies: Number(data?.discrepancies ?? data?.needsReview ?? 0),
    finalApproved: Number(data?.finalApproved ?? 0),
    totalAmount: Number(data?.totalAmount ?? 0),
    matchedAmount: Number(data?.matchedAmount ?? 0),
  };
}

/**
 * 3. Get Reconciliation Transactions
 * GET /api/mizan/reconciliations/{sessionId}/transactions (status, search, page, pageSize)
 */
export async function getReconciliationTransactions(
  sessionId: string,
  params?: ReconciliationTransactionsParams
): Promise<PaginatedResult<MizanTransactionDto>> {
  const cleanParams: Record<string, string | number> = {};

  if (params?.status && params.status !== 'all') {
    cleanParams.status = params.status;
  }
  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }
  if (params?.page && params.page >= 1) {
    cleanParams.page = params.page;
  }
  if (params?.pageSize && params.pageSize >= 1 && params.pageSize <= 100) {
    cleanParams.pageSize = params.pageSize;
  }

  const response = await httpClient.get<unknown>(`/mizan/reconciliations/${sessionId}/transactions`, {
    params: cleanParams,
  });

  return unwrapPaginatedResponse<MizanTransactionDto>(response, params?.page || 1, params?.pageSize || 20);
}

/**
 * 4. Get Reconciliation History
 * GET /api/Mizan/reconciliations (page, pageSize, bankName, fromDate, toDate, search)
 * Never sends null, "", or UserId
 */
export async function getReconciliationHistory(
  params?: ReconciliationHistoryParams
): Promise<PaginatedResult<HistoricalReconciliationSession>> {
  const cleanParams: Record<string, string | number> = {
    page: params?.page && params.page >= 1 ? params.page : 1,
    pageSize: params?.pageSize && params.pageSize >= 1 && params.pageSize <= 100 ? params.pageSize : 10,
  };

  if (params?.bankName && params.bankName.trim() && params.bankName !== 'all') {
    cleanParams.bankName = params.bankName.trim();
  }

  // Validate fromDate <= toDate before sending
  const from = params?.fromDate?.trim();
  const to = params?.toDate?.trim();

  if (from && to) {
    if (from <= to) {
      cleanParams.fromDate = from;
      cleanParams.toDate = to;
    } else {
      console.warn('[mizanService] fromDate must be <= toDate. Skipping invalid date range filter.');
    }
  } else if (from) {
    cleanParams.fromDate = from;
  } else if (to) {
    cleanParams.toDate = to;
  }

  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }

  // Note: Using api.get with /Mizan/reconciliations
  const response = await api.get<unknown>('/Mizan/reconciliations', {
    params: cleanParams,
  });

  return unwrapPaginatedResponse<HistoricalReconciliationSession>(
    response,
    Number(cleanParams.page),
    Number(cleanParams.pageSize)
  );
}

export async function getReconciliations(
  params?: ReconciliationHistoryParams
): Promise<PaginatedResult<HistoricalReconciliationSession>> {
  return getReconciliationHistory(params);
}

/**
 * 5. Approve Matched Transaction
 * POST /api/mizan/transactions/{transactionId}/approve
 * Takes NO Request Body
 */
export async function approveMatchedTransaction(transactionId: string): Promise<unknown> {
  const response = await httpClient.post<unknown>(`/mizan/transactions/${transactionId}/approve`);
  return unwrapResponse(response);
}

/**
 * 6. Convert Sale to Debt
 * POST /api/mizan/sales/{saleId}/convert-to-debt
 * Takes NO Request Body
 */
export async function convertSaleToDebt(saleId: string): Promise<ConvertToDebtResponseDto> {
  const response = await httpClient.post<unknown>(`/mizan/sales/${saleId}/convert-to-debt`);
  const data = unwrapResponse<Record<string, unknown>>(response);

  return {
    isSuccess: Boolean(data?.isSuccess ?? true),
    debtNumber: String(data?.debtNumber ?? (data?.data as Record<string, unknown>)?.debtNumber ?? ''),
    debtId: String(data?.debtId ?? (data?.data as Record<string, unknown>)?.debtId ?? ''),
    amount: Number(data?.amount ?? (data?.data as Record<string, unknown>)?.amount ?? 0),
    message: String(data?.message ?? 'تم تحويل الفاتورة إلى دين بنجاح'),
  };
}

/**
 * 7. Create Instant Sale from Bank Deposit
 * POST /api/mizan/transactions/{transactionId}/create-sale
 * CRITICAL CONTRACT RULE: Takes NO Request Body (null / empty)!
 * All fields are derived automatically by backend.
 */
export async function createSaleFromDeposit(transactionId: string): Promise<CreateSaleResponseDto> {
  // Must NOT send any body or payload
  const response = await httpClient.post<unknown>(`/mizan/transactions/${transactionId}/create-sale`);
  const data = unwrapResponse<Record<string, unknown>>(response);

  return {
    isSuccess: Boolean(data?.isSuccess ?? true),
    data: data?.data ?? true,
    message: String(data?.message ?? 'تم إنشاء المبيعة الفورية للإيداع بنجاح.'),
    saleId: String(data?.saleId ?? (data?.data as Record<string, unknown>)?.saleId ?? ''),
    invoiceNumber: String(
      data?.invoiceNumber ?? (data?.data as Record<string, unknown>)?.invoiceNumber ?? ''
    ),
  };
}
