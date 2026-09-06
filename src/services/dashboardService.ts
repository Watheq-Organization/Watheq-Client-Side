import { httpClient, ApiError } from '../api/httpClient';
import type { DashboardSummary } from '../types/dashboard';

/**
 * GET http://whateq.runasp.net/api/Dashboard/summary
 *
 * Fetches the current merchant's real dashboard statistics
 * (customersCount / totalDebt / collectedAmount / remainingAmount /
 * overdueAmount). No UserId is sent — the backend derives the currently
 * authenticated merchant from the JWT (attached automatically by
 * httpClient), per the confirmed API contract.
 *
 * Unlike the previous version, this throws on failure instead of
 * swallowing the error and returning null — callers use
 * `toDashboardSummaryErrorMessage` to show a real error state instead of
 * silently falling back to fake/zero numbers.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await httpClient.get<unknown>('/Dashboard/summary');
  return normalizeDashboardSummary(extractDashboardSummary(response));
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

/**
 * Unwraps whatever ApiResponse-style envelope the backend puts the
 * DashboardSummaryDto in. Earlier this only checked one level of
 * `{ result: {...} }` / `{ data: {...} }` — if the real response nests
 * further (e.g. `{ success, data: { success, data: {...} } }`, or uses a
 * different wrapper key entirely), that single-level check silently missed
 * the actual numbers. Every field then normalized to 0 with no error ever
 * thrown, since the HTTP request itself succeeded — exactly the "always
 * shows 0" symptom with no error banner.
 *
 * Fix: recursively search the response for the first nested object that
 * actually contains one of the known DashboardSummaryDto fields, instead
 * of assuming a specific wrapper key or nesting depth.
 */
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

  // Nothing matched — fall back to the raw response so normalizeDashboardSummary
  // still produces a well-formed (all-zero) DashboardSummary instead of throwing.
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
