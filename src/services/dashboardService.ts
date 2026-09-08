import { httpClient, ApiError } from '../api/httpClient';
import type { DashboardSummary, OverduePaymentItem, RecentActivityItem } from '../types/dashboard';
import { getCustomers, getCustomerProfile } from './customerService';

/**
 * GET http://whateq.runasp.net/api/Dashboard/summary
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
 * Filters customers with total debt / outstanding balance or overdue status.
 */
export async function getOverduePayments(): Promise<OverduePaymentItem[]> {
  const dtos = await getCustomers();
  const overdueCustomers = dtos.filter(
    (c) => (c.currentBalance ?? c.totalDebt) > 0 || (c.status && c.status.toLowerCase().includes('overdue'))
  );

  return overdueCustomers.map((c) => ({
    id: String(c.id),
    customerName: c.fullName || 'عميل بدون اسم',
    amount: (c.currentBalance ?? c.totalDebt).toLocaleString('ar-SA'),
    dueDate: formatArabicDate(c.createdAt),
    phone: c.phoneNumber,
  }));
}

/**
 * Fetches real recent activities from customer additions and transactions in the database.
 */
export async function getRecentActivities(): Promise<RecentActivityItem[]> {
  const dtos = await getCustomers();
  const activities: RecentActivityItem[] = [];

  const sortedCustomers = [...dtos].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  // 1. Customer Registration Activities
  for (const c of sortedCustomers.slice(0, 10)) {
    const timeMs = new Date(c.createdAt).getTime() || Date.now();
    activities.push({
      id: `cust-add-${c.id}`,
      time: formatRelativeTime(c.createdAt),
      title: 'إضافة عميل جديد',
      description: `تم تسجيل العميل "${c.fullName}" في النظام.`,
      dotColor: 'bg-[#0f284e]',
      timestamp: timeMs,
    });
  }

  // 2. Fetch profiles for top 5 customers to pull real transaction history
  const topFive = sortedCustomers.slice(0, 5);
  const profilePromises = topFive.map((c) => getCustomerProfile(c.id).catch(() => null));
  const profiles = await Promise.all(profilePromises);

  profiles.forEach((profile) => {
    if (!profile || !profile.transactions) return;
    profile.transactions.forEach((tx, idx) => {
      const txTimeMs = new Date(tx.date).getTime() || Date.now();
      const typeStr = String(tx.type || '').toLowerCase();
      const isPayment = typeStr.includes('pay') || typeStr.includes('دفعة') || typeStr.includes('سداد');
      const isDebt = typeStr.includes('debt') || typeStr.includes('دين') || !isPayment;

      activities.push({
        id: `tx-${profile.id}-${idx}-${txTimeMs}`,
        time: formatRelativeTime(tx.date),
        title: isPayment ? 'تم استلام دفعة' : isDebt ? 'إضافة دين جديد' : 'معاملة مالية',
        description: isPayment
          ? `قام ${profile.fullName} بسداد مبلغ ${Number(tx.amount).toLocaleString('ar-SA')} ر.س.`
          : `تم تسجيل دين بقيمة ${Number(tx.amount).toLocaleString('ar-SA')} ر.س على ${profile.fullName}`,
        dotColor: isPayment ? 'bg-[#22c55e]' : 'bg-[#0f284e]',
        timestamp: txTimeMs,
      });
    });
  });

  // Sort activities newest-first
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities.slice(0, 30);
}

function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
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

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'مؤخراً';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 5) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes.toLocaleString('ar-SA')} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours.toLocaleString('ar-SA')} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays.toLocaleString('ar-SA')} أيام`;
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
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

