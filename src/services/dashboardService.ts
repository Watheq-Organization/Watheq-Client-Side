import { httpClient, ApiError } from '../api/httpClient';
import type { DashboardSummary, OverduePaymentItem, RecentActivityItem } from '../types/dashboard';
import { parseApiDate, formatRelativeTime, formatApiDate } from '../lib/dateUtils';
import { normalizeCurrencyCode, getCurrencyId } from '../utils/currency';
import { getOutstandingDebtsReport, getOverdueDebtsReport } from './reportService';

/**
 * Fetches accurate overdue debt totals grouped by currency from both
 * `/reports/outstanding-debts?isOverdue=true` (summing all overdue rows cleanly
 * across currencies) and `/reports/overdue-debts` summary.
 */
async function fetchOverdueAmountsByCurrency(): Promise<Map<string, number> | null> {
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [outstandingFirstRes, overdueReportRes] = await Promise.allSettled([
    getOutstandingDebtsReport({ isOverdue: true, pageNumber: 1, pageSize: 200 }),
    getOverdueDebtsReport({ fromDate: '2020-01-01', toDate: tomorrowIso, pageNumber: 1, pageSize: 1 }),
  ]);

  const itemsOverdueMap = new Map<string, number>();
  const outstandingSummaryMap = new Map<string, number>();
  const overdueReportSummaryMap = new Map<string, number>();
  let hasCompleteOverdueItems = false;
  let totalItemsCount = 0;

  if (overdueReportRes.status === 'fulfilled') {
    for (const s of overdueReportRes.value.summary) {
      const code = normalizeCurrencyCode(s.currencyCode);
      const prev = overdueReportSummaryMap.get(code) ?? 0;
      overdueReportSummaryMap.set(code, prev + (Number(s.totalOverdueAmount) || 0));
    }
  }

  if (outstandingFirstRes.status === 'fulfilled') {
    const first = outstandingFirstRes.value;
    for (const s of first.summary) {
      const code = normalizeCurrencyCode(s.currencyCode);
      const prev = outstandingSummaryMap.get(code) ?? 0;
      outstandingSummaryMap.set(code, prev + (Number(s.totalOverdueAmount) || 0));
    }

    const allItems = [...(first.details?.items ?? [])];
    const reportedTotal = first.details?.totalCount ?? allItems.length;

    if (reportedTotal > allItems.length && allItems.length > 0) {
      const totalPages = Math.min(10, Math.ceil(reportedTotal / 200));
      const extraPages = await Promise.allSettled(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          getOutstandingDebtsReport({ isOverdue: true, pageNumber: i + 2, pageSize: 200 })
        )
      );
      for (const pageRes of extraPages) {
        if (pageRes.status === 'fulfilled' && pageRes.value.details?.items) {
          allItems.push(...pageRes.value.details.items);
        }
      }
    }

    for (const item of allItems) {
      const code = normalizeCurrencyCode(item.currencyCode);
      const amt = Number(item.remainingAmount > 0 ? item.remainingAmount : item.amount) || 0;
      itemsOverdueMap.set(code, (itemsOverdueMap.get(code) ?? 0) + amt);
    }

    totalItemsCount = allItems.length;
    hasCompleteOverdueItems = allItems.length >= reportedTotal && allItems.length > 0;
  }

  if (outstandingFirstRes.status === 'rejected' && overdueReportRes.status === 'rejected') {
    return null;
  }

  const allCodes = new Set<string>([
    ...itemsOverdueMap.keys(),
    ...outstandingSummaryMap.keys(),
    ...overdueReportSummaryMap.keys(),
  ]);

  const resolved = new Map<string, number>();
  for (const code of allCodes) {
    if (hasCompleteOverdueItems && totalItemsCount > 0) {
      const itemsSum = itemsOverdueMap.get(code) ?? 0;
      const summaryFallback = Math.max(
        outstandingSummaryMap.get(code) ?? 0,
        overdueReportSummaryMap.get(code) ?? 0
      );
      resolved.set(code, itemsSum > 0 ? itemsSum : summaryFallback);
    } else {
      resolved.set(
        code,
        Math.max(
          itemsOverdueMap.get(code) ?? 0,
          outstandingSummaryMap.get(code) ?? 0,
          overdueReportSummaryMap.get(code) ?? 0
        )
      );
    }
  }

  return resolved;
}

/**
 * GET https://whateq.runasp.net/api/Dashboard/summary
 *
 * Fetches the current merchant's real dashboard statistics
 * (customersCount / totalDebt / collectedAmount / remainingAmount /
 * overdueAmount). No UserId is sent — the backend derives the currently
 * authenticated merchant from the JWT (attached automatically by
 * httpClient), per the confirmed API contract.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [summaryResult, overdueByCurrencyResult] = await Promise.allSettled([
    httpClient.get<unknown>('/Dashboard/summary'),
    fetchOverdueAmountsByCurrency(),
  ]);

  if (summaryResult.status === 'rejected') {
    throw summaryResult.reason;
  }

  const summary = normalizeDashboardSummary(extractDashboardSummary(summaryResult.value));

  // If the backend's /Dashboard/summary doesn't return per-currency overdueAmount inside
  // summaryByCurrency, populate each currency's overdue total from overdue reports/items
  // so multi-currency merchants see exact overdue values for every currency (USD, ILS, EUR...).
  if (
    summary.summaryByCurrency &&
    summary.summaryByCurrency.length > 0 &&
    summary.summaryByCurrency.some((c) => c.overdueAmount === undefined) &&
    overdueByCurrencyResult.status === 'fulfilled' &&
    overdueByCurrencyResult.value !== null
  ) {
    const overdueMap = overdueByCurrencyResult.value;
    summary.summaryByCurrency = summary.summaryByCurrency.map((c) => {
      const code = normalizeCurrencyCode(c.currencyCode);
      return {
        ...c,
        overdueAmount: c.overdueAmount ?? (overdueMap.get(code) ?? 0),
      };
    });
  }

  return summary;
}

/** Calculates whole calendar days elapsed since the due date (if strictly overdue). */
function computeDaysOverdue(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const due = parseApiDate(dateStr);
  if (Number.isNaN(due.getTime())) return undefined;

  const now = new Date();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((todayStart - dueStart) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : undefined;
}

/**
 * Fetches real overdue payments from the merchant's customer records in the database.
 * First checks the real overdue debts report to get actual debt due dates.
 */
export async function getOverduePayments(): Promise<OverduePaymentItem[]> {
  try {
    const response = await httpClient.get<unknown>('/Dashboard/overdue-payments');
    
    let rawItems: unknown[] = [];
    if (Array.isArray(response)) {
      rawItems = response;
    } else if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        rawItems = obj.data;
      } else if (Array.isArray(obj.items)) {
        rawItems = obj.items;
      } else if (Array.isArray(obj.result)) {
        rawItems = obj.result;
      } else if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        if (Array.isArray(inner.data)) {
          rawItems = inner.data;
        } else if (Array.isArray(inner.items)) {
          rawItems = inner.items;
        }
      }
    }

    const mapped = rawItems.map((item) => {
      const it = (item || {}) as Record<string, unknown>;
      const rawDueDate = String(it.dueDate ?? it.DueDate ?? it.date ?? it.createdAt ?? '');
      const rawCurr =
        it.currencyCode ??
        it.CurrencyCode ??
        it.currency ??
        it.Currency ??
        it.currencyId ??
        it.CurrencyId;
      const hasExplicitCurrency = rawCurr != null && rawCurr !== '';
      const currencyCode = hasExplicitCurrency ? normalizeCurrencyCode(rawCurr) : 'ILS';
      const numericAmount = Number(
        it.amount ?? it.Amount ?? it.remainingAmount ?? it.RemainingAmount ?? 0
      );

      return {
        item: {
          id: String(it.id ?? it.debtId ?? it.paymentId ?? it.customerId ?? ''),
          customerId: String(it.customerId ?? it.CustomerId ?? ''),
          customerName: String(it.customerName ?? it.CustomerName ?? 'عميل بدون اسم'),
          amount: numericAmount.toLocaleString('en-US'),
          dueDate: formatArabicDate(rawDueDate),
          phone: String(it.phone ?? it.phoneNumber ?? it.PhoneNumber ?? ''),
          currencyCode,
          daysOverdue: computeDaysOverdue(rawDueDate),
        } satisfies OverduePaymentItem,
        numericAmount,
        hasExplicitCurrency,
      };
    });

    if (mapped.some((m) => !m.hasExplicitCurrency)) {
      try {
        const overdueReport = await getOutstandingDebtsReport({
          isOverdue: true,
          pageNumber: 1,
          pageSize: 100,
        });
        const items = overdueReport.details?.items ?? [];
        if (items.length > 0) {
          const byDebtId = new Map<string, string>();
          const byCustomerAmount = new Map<string, string>();
          for (const d of items) {
            const code = normalizeCurrencyCode(d.currencyCode);
            if (d.debtId) byDebtId.set(String(d.debtId), code);
            if (d.customerId) {
              byCustomerAmount.set(`${d.customerId}:${d.remainingAmount}`, code);
              byCustomerAmount.set(`${d.customerId}:${d.amount}`, code);
            }
          }

          return mapped.map(({ item, numericAmount, hasExplicitCurrency }) => {
            if (hasExplicitCurrency) return item;
            const resolved =
              byDebtId.get(item.id) ??
              byCustomerAmount.get(`${item.customerId}:${numericAmount}`);
            if (!resolved) return item;
            return {
              ...item,
              currencyCode: normalizeCurrencyCode(resolved),
            };
          });
        }
      } catch {
        // Keep base overdue items if supplementary currency lookup fails
      }
    }

    return mapped.map((m) => m.item);
  } catch (err) {
    console.error('[getOverduePayments] Failed to fetch:', err);
    return [];
  }
}

/**
 * Fetches real recent activities from the backend.
 */
export async function getRecentActivities(): Promise<RecentActivityItem[]> {
  try {
    const response = await httpClient.get<unknown>('/Dashboard/recent-activities');
    
    let rawItems: unknown[] = [];
    if (Array.isArray(response)) {
      rawItems = response;
    } else if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        rawItems = obj.data;
      } else if (Array.isArray(obj.items)) {
        rawItems = obj.items;
      } else if (Array.isArray(obj.result)) {
        rawItems = obj.result;
      } else if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        if (Array.isArray(inner.data)) {
          rawItems = inner.data;
        } else if (Array.isArray(inner.items)) {
          rawItems = inner.items;
        }
      }
    }

    return rawItems.map((item, idx) => {
      const it = (item || {}) as Record<string, unknown>;
      const timeStr = String(it.date ?? it.createdAt ?? it.time ?? it.timestamp ?? it.Date ?? it.CreatedAt ?? '');
      const timeMs = parseApiDate(timeStr).getTime() || Date.now();
      const typeStr = String(it.type ?? it.Type ?? '').toLowerCase();
      
      const isPayment = typeStr.includes('pay') || typeStr.includes('دفعة') || typeStr.includes('سداد');
      const isDebt = typeStr.includes('debt') || typeStr.includes('دين');
      const category: RecentActivityItem['category'] = isPayment ? 'payment' : isDebt ? 'debt' : 'other';
      const dotColor = String(it.dotColor ?? (isPayment ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'));
      
      return {
        id: String(it.id ?? it.activityId ?? `act-${idx}-${timeMs}`),
        time: formatRelativeTime(timeStr),
        title: String(it.title ?? it.Title ?? (isPayment ? 'تم استلام دفعة' : 'معاملة مالية')),
        description: String(it.description ?? it.Description ?? ''),
        dotColor,
        timestamp: timeMs,
        category,
      };
    }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
  } catch (err) {
    console.error('[getRecentActivities] Failed to fetch:', err);
    return [];
  }
}

function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const formatted = formatApiDate(dateStr, false);
  return formatted || dateStr;
}

/**
 * The known DashboardSummaryDto field names. Used both to normalize values
 * and to recognize which nested object in the response actually IS the
 * summary (see extractDashboardSummary below).
 */
const SUMMARY_FIELDS = [
  'customersCount',
  'totalDebt',
  'collectedAmount',
  'remainingAmount',
  'overdueAmount',
  'summaryByCurrency',
  'SummaryByCurrency',
] as const;

function looksLikeSummary(obj: Record<string, unknown>): boolean {
  return SUMMARY_FIELDS.some((key) => key in obj);
}

function extractDashboardSummary(response: unknown): unknown {
  const queue: unknown[] = [response];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || Array.isArray(current)) continue;
    if (seen.has(current)) continue;
    seen.add(current);

    const obj = current as Record<string, unknown>;
    if (looksLikeSummary(obj)) return obj;

    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        queue.push(value);
      }
    }
  }

  return response;
}

function normalizeDashboardSummary(raw: unknown): DashboardSummary {
  const r = (raw ?? {}) as Record<string, unknown>;

  const rawSummaryByCurrency = Array.isArray(r.summaryByCurrency)
    ? r.summaryByCurrency
    : Array.isArray(r.SummaryByCurrency)
      ? r.SummaryByCurrency
      : [];

  const summaryByCurrency = rawSummaryByCurrency.map((item) => {
    const it = (item ?? {}) as Record<string, unknown>;
    const rawCurr = it.currencyCode ?? it.CurrencyCode ?? it.currency ?? it.Currency ?? it.currencyId ?? it.CurrencyId;
    const code = normalizeCurrencyCode(rawCurr);
    const id = Number(it.currencyId ?? it.CurrencyId) || getCurrencyId(code);
    const rawOverdue =
      it.overdueAmount ?? it.OverdueAmount ?? it.totalOverdueAmount ?? it.TotalOverdueAmount;
    const overdueAmount =
      rawOverdue !== undefined && rawOverdue !== null && rawOverdue !== ''
        ? Number(rawOverdue) || 0
        : undefined;
    return {
      currencyId: id,
      currencyCode: code,
      totalDebt: Number(it.totalDebt ?? it.TotalDebt) || 0,
      collectedAmount: Number(it.collectedAmount ?? it.CollectedAmount) || 0,
      remainingAmount: Number(it.remainingAmount ?? it.RemainingAmount) || 0,
      overdueAmount,
    };
  });

  return {
    customersCount: Number(r.customersCount ?? r.CustomersCount) || 0,
    totalDebt: Number(r.totalDebt ?? r.TotalDebt) || 0,
    collectedAmount: Number(r.collectedAmount ?? r.CollectedAmount) || 0,
    remainingAmount: Number(r.remainingAmount ?? r.RemainingAmount) || 0,
    overdueAmount: Number(r.overdueAmount ?? r.OverdueAmount) || 0,
    summaryByCurrency: summaryByCurrency.length > 0 ? summaryByCurrency : undefined,
  };
}

/** Maps getDashboardSummary errors to user-friendly Arabic messages, mirroring customerService's error mappers. */
export function toDashboardSummaryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر جلب إحصائيات لوحة القيادة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}
