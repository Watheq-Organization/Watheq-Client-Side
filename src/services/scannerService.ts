import { httpClient, ApiError } from '../api/httpClient';

// ============================================================================
// Types & Interfaces for Scanner Sessions API
// ============================================================================

export interface CreateScannerSessionData {
  sessionId: string;
  pairingSecret: string;
  expiresAt: string;
}

export interface ScannerSessionStatusData {
  sessionId: string;
  status: 'Pending' | 'Paired' | 'Revoked' | 'Expired' | string;
  expiresAt?: string;
}

export interface PairScannerSessionPayload {
  pairingSecret: string;
}

export interface PairScannerSessionResponseData {
  token: string;
}

export interface PairScannerSessionResult {
  isSuccess: boolean;
  message: string;
  token?: string;
}

// ============================================================================
// Error Handler
// ============================================================================

export function toScannerErrorMessage(err: unknown, defaultMsg = 'حدث خطأ في جلسة الماسح.'): string {
  if (err instanceof ApiError) {
    const serverMsg =
      typeof err.body === 'object' && err.body !== null
        ? String((err.body as Record<string, unknown>).message ?? (err.body as Record<string, unknown>).title ?? '')
        : String(err.body ?? '');

    if (serverMsg.includes('no longer pending')) {
      return 'الجلسة لم تعد معلقة ولا يمكن إتمام عملية الربط.';
    }
    if (serverMsg.includes('has expired') || serverMsg.includes('expired')) {
      return 'انتهت صلاحية جلسة الربط (مدة الجلسة 10 دقائق).';
    }
    if (serverMsg.includes('Invalid pairing secret') || serverMsg.includes('Invalid secret')) {
      return 'سر الربط المرسل غير مطابق للبصمة المخزنة.';
    }
    if (serverMsg.includes('not owned by user') || serverMsg.includes('Session not found') || err.status === 404) {
      return 'جلسة الربط غير موجودة أو لا تخص هذا الحساب.';
    }
    if (serverMsg.includes('No business found')) {
      return 'لم يتم العثور على نشاط تجاري مرتبط بحسابك.';
    }
    if (err.status === 401) {
      return 'انتهت صلاحية تسجيل الدخول. يرجى تسجيل الدخول مجدداً.';
    }
    if (err.status === 408) {
      return 'انتهت مهلة انتظار الخادم. تحقق من اتصالك وأعد المحاولة.';
    }
    if (err.status === 0) {
      return 'تعذّر الاتصال بالخادم. يرجى التحقق من الشبكة.';
    }

    return serverMsg || defaultMsg;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return defaultMsg;
}

// ============================================================================
// Scanner API Methods
// ============================================================================

/**
 * 1. POST /api/scanner/sessions
 *
 * Creates a new pairing session for the authenticated merchant.
 * Session lasts for 10 minutes from creation.
 */
export async function createScannerSession(): Promise<CreateScannerSessionData> {
  const response = await httpClient.post<unknown>('/scanner/sessions');
  const parsed = response as Record<string, unknown>;

  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data as CreateScannerSessionData;
  }

  return parsed as unknown as CreateScannerSessionData;
}

/**
 * 2. GET /api/scanner/sessions/{sessionId}
 *
 * Queries the current status of a pairing session (Pending, Paired, etc.).
 */
export async function getScannerSessionStatus(sessionId: string): Promise<ScannerSessionStatusData> {
  const encodedId = encodeURIComponent(sessionId);
  const response = await httpClient.get<unknown>(`/scanner/sessions/${encodedId}`);
  const parsed = response as Record<string, unknown>;

  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data as ScannerSessionStatusData;
  }

  return parsed as unknown as ScannerSessionStatusData;
}

/**
 * 3. POST /api/scanner/sessions/{sessionId}/pair
 *
 * Pairs a scanner device with the session using the pairingSecret.
 * On success, issues and returns a Scanner Token for the device.
 */
export async function pairScannerSession(
  sessionId: string,
  pairingSecret: string
): Promise<PairScannerSessionResult> {
  const encodedId = encodeURIComponent(sessionId);
  const response = await httpClient.post<unknown>(`/scanner/sessions/${encodedId}/pair`, {
    pairingSecret,
  });
  const parsed = response as Record<string, unknown>;

  const data = (parsed?.data && typeof parsed.data === 'object'
    ? parsed.data
    : parsed) as Record<string, unknown> | null;

  const token = typeof data?.token === 'string' ? data.token : undefined;

  if (token) {
    try {
      localStorage.setItem('watheq_scanner_token', token);
    } catch {
      // storage error
    }
  }

  return {
    isSuccess: Boolean(parsed?.isSuccess ?? true),
    message: String(parsed?.message ?? 'Scanner paired successfully.'),
    token,
  };
}

export interface RevokeScannerSessionResult {
  isSuccess: boolean;
  message: string;
  data: boolean;
}

/**
 * 4. POST /api/scanner/sessions/{sessionId}/revoke
 *
 * Revokes/cancels an active scanner pairing session.
 * Idempotent: returns 200 OK with data: true even if already revoked.
 */
export async function revokeScannerSession(sessionId: string): Promise<RevokeScannerSessionResult> {
  const encodedId = encodeURIComponent(sessionId);
  const response = await httpClient.post<unknown>(`/scanner/sessions/${encodedId}/revoke`);
  const parsed = response as Record<string, unknown>;

  return {
    isSuccess: Boolean(parsed?.isSuccess ?? true),
    message: String(parsed?.message ?? 'Session revoked.'),
    data: Boolean(parsed?.data ?? true),
  };
}
