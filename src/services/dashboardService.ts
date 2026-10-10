import { httpClient, ApiError } from '../api/httpClient';
import type { DashboardSummary, OverduePaymentItem, RecentActivityItem } from '../types/dashboard';
import { parseApiDate, formatRelativeTime } from '../lib/dateUtils';

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
  const response = await httpClient.get<unknown>('/Dashboard/summary');
  return normalizeDashboardSummary(extractDashboardSummary(response));
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

    return rawItems.map((item) => {
      const it = (item || {}) as Record<string, unknown>;
      return {
        id: String(it.id ?? it.debtId ?? it.paymentId ?? it.customerId ?? ''),
        customerId: String(it.customerId ?? it.CustomerId ?? ''),
        customerName: String(it.customerName ?? it.CustomerName ?? 'عميل بدون اسم'),
        amount: Number(it.amount ?? it.Amount ?? it.remainingAmount ?? it.RemainingAmount ?? 0).toLocaleString('en-US'),
        dueDate: formatArabicDate(String(it.dueDate ?? it.DueDate ?? it.date ?? it.createdAt ?? '')),
        phone: String(it.phone ?? it.phoneNumber ?? it.PhoneNumber ?? ''),
      };
    });
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
      const dotColor = String(it.dotColor ?? (isPayment ? 'bg-[#22c55e]' : 'bg-[#0f284e]'));
      
      return {
        id: String(it.id ?? it.activityId ?? `act-${idx}-${timeMs}`),
        time: formatRelativeTime(timeStr),
        title: String(it.title ?? it.Title ?? (isPayment ? 'تم استلام دفعة' : 'معاملة مالية')),
        description: String(it.description ?? it.Description ?? ''),
        dotColor,
        timestamp: timeMs,
      };
    }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
  } catch (err) {
    console.error('[getRecentActivities] Failed to fetch:', err);
    return [];
  }
}

function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseApiDate(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
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
  return {
    customersCount: Number(r.customersCount) || 0,
    totalDebt: Number(r.totalDebt) || 0,
    collectedAmount: Number(r.collectedAmount) || 0,
    remainingAmount: Number(r.remainingAmount) || 0,
    overdueAmount: Number(r.overdueAmount) || 0,
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

