// ============================================================
// Auth Service – Watheq Login API Integration
// Endpoint: POST http://whateq.runasp.net/api/auth/login
// ============================================================

const API_BASE_URL = 'http://whateq.runasp.net';

// ── Storage Keys ────────────────────────────────────────────
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'watheq_access_token',
  REFRESH_TOKEN: 'watheq_refresh_token',
  EXPIRES_AT: 'watheq_expires_at',
  USER_TYPE: 'watheq_user_type',
  USER_PHONE: 'watheq_user_phone',
} as const;

// ── Types ────────────────────────────────────────────────────
export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userType: string;
}

export interface LoginResponse {
  data: AuthData | null;
  message: string;
  statusCode: string;
}

// ── loginUser ────────────────────────────────────────────────
/**
 * Sends POST /api/auth/login and stores tokens on success.
 * @param credentials  { phoneNumber, password }
 * @param rememberMe   true → localStorage, false → sessionStorage
 */
export async function loginUser(
  credentials: LoginRequest,
  rememberMe: boolean = true
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: credentials.phoneNumber.trim(),
        password: credentials.password,
      }),
    });

    const json: {
      result?: { code: number; message: string };
      data?: AuthData;
      message?: string;
      statusCode?: string;
    } = await response.json();

    const authData = json.data;
    const isSuccess = response.ok && authData?.accessToken;

    if (isSuccess && authData) {
      // Persist tokens
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      storage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      storage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, authData.expiresAt);
      storage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, authData.userType);
      storage.setItem(AUTH_STORAGE_KEYS.USER_PHONE, credentials.phoneNumber);

      return {
        data: authData,
        message: json.result?.message || json.message || 'تم تسجيل الدخول بنجاح',
        statusCode: String(json.result?.code || json.statusCode || '200'),
      };
    }

    // ── Error handling ──────────────────────────────────────
    const apiCode = json.result?.code || response.status;
    const rawMsg = json.result?.message || json.message || '';

    let errorMessage = 'بيانات الاعتماد غير صحيحة، يرجى التأكد من رقم الجوال وكلمة المرور.';

    if (apiCode === 401 || rawMsg.toLowerCase().includes('invalid credentials')) {
      errorMessage = 'رقم الجوال أو كلمة المرور غير صحيحة.';
    } else if (apiCode === 403 || rawMsg.toLowerCase().includes('forbidden')) {
      errorMessage = 'الحساب غير مفعّل، يرجى التواصل مع الدعم الفني.';
    } else if (rawMsg) {
      errorMessage = rawMsg;
    }

    return {
      data: null,
      message: errorMessage,
      statusCode: String(apiCode || 'ERROR'),
    };
  } catch (error) {
    console.error('[Auth] Login network error:', error);
    return {
      data: null,
      message: 'تعذّر الاتصال بالخادم، يرجى التأكد من اتصالك بالإنترنت.',
      statusCode: 'NETWORK_ERROR',
    };
  }
}

export interface RegisterRequest {
  fullName: string;
  businessName: string;
  phoneNumber: string;
  password: string;
}

// ── registerUser ─────────────────────────────────────────────
/**
 * Sends POST /api/Auth/register to create a new user account.
 * @param data         { fullName, businessName, phoneNumber, password }
 * @param rememberMe   true → localStorage, false → sessionStorage
 */
export async function registerUser(
  data: RegisterRequest,
  rememberMe: boolean = true
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        businessName: data.businessName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        password: data.password,
      }),
    });

    const json: {
      result?: { code: number; message: string };
      data?: AuthData;
      message?: string;
      statusCode?: string;
    } = await response.json();

    const authData = json.data;
    const isSuccess = response.ok && authData?.accessToken;

    if (isSuccess && authData) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      storage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      storage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, authData.expiresAt);
      storage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, authData.userType);
      storage.setItem(AUTH_STORAGE_KEYS.USER_PHONE, data.phoneNumber);

      return {
        data: authData,
        message: json.result?.message || 'تم إنشاء الحساب بنجاح!',
        statusCode: String(json.result?.code || '201'),
      };
    }

    // ── Error handling ──────────────────────────────────────
    const apiCode = json.result?.code || response.status;
    const rawMsg = json.result?.message || json.message || '';

    let errorMessage = 'تعذّر إنشاء الحساب، يرجى التأكد من صحة البيانات المدخلة.';

    const lower = rawMsg.toLowerCase();
    if (lower.includes('already registered')) {
      errorMessage = 'رقم الجوال مسجل مسبقاً، يرجى استخدام رقم آخر أو تسجيل الدخول.';
    } else if (lower.includes('lowercase')) {
      errorMessage = 'كلمة المرور يجب أن تحتوي على حرف إنجليزي صغير واحد على الأقل (a - z).';
    } else if (lower.includes('uppercase')) {
      errorMessage = 'كلمة المرور يجب أن تحتوي على حرف إنجليزي كبير واحد على الأقل (A - Z).';
    } else if (lower.includes('digit')) {
      errorMessage = 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0 - 9).';
    } else if (lower.includes('non alphanumeric') || lower.includes('special')) {
      errorMessage = 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (مثل @ أو # أو !).';
    } else if (lower.includes('at least') && lower.includes('character')) {
      errorMessage = 'كلمة المرور يجب أن تتكون من 6 خانات على الأقل.';
    } else if (rawMsg) {
      errorMessage = rawMsg;
    }

    return {
      data: null,
      message: errorMessage,
      statusCode: String(apiCode || 'ERROR'),
    };
  } catch (error) {
    console.error('[Auth] Register network error:', error);
    return {
      data: null,
      message: 'تعذّر الاتصال بالخادم، يرجى التأكد من اتصالك بالإنترنت.',
      statusCode: 'NETWORK_ERROR',
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────

/** Returns the Authorization header for protected API calls */
export function getAuthHeader(): Record<string, string> {
  const token =
    localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Clears all stored auth data (logout) */
export function logoutUser(): void {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/** Returns current auth state from storage */
export function getStoredUser() {
  const token =
    localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  const phoneNumber =
    localStorage.getItem(AUTH_STORAGE_KEYS.USER_PHONE) ||
    sessionStorage.getItem(AUTH_STORAGE_KEYS.USER_PHONE);
  const userType =
    localStorage.getItem(AUTH_STORAGE_KEYS.USER_TYPE) ||
    sessionStorage.getItem(AUTH_STORAGE_KEYS.USER_TYPE);
  const expiresAt =
    localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT) ||
    sessionStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return {
    isAuthenticated: !!token && !isExpired,
    token,
    phoneNumber,
    userType,
    expiresAt,
  };
}
