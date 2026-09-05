import { httpClient, ApiError } from '../api/httpClient';
import { clearStoredToken } from '../lib/authToken';
import type {
  RegisterFormData,
  RegisterApiPayload,
  AuthApiResponseShape,
  AuthResult,
  LoginFormData,
} from '../types/auth';

/**
 * ⚠️ UNVERIFIED BACKEND CONTRACT — see types/auth.ts for full context.
 *
 * The backend wraps AT LEAST its error responses in a nested `result`
 * object (see toFriendlyErrorMessage below, which reads
 * `body.result.message`). That's a strong signal the success responses
 * are wrapped the same way (a common ASP.NET "ApiResponse<T>" pattern:
 * { isSuccess, message, result: { token, ... } }) — but this was never
 * confirmed against a real response body, so instead of hard-coding one
 * guessed path, extractAuthToken below checks every path we know this
 * kind of backend commonly uses. This one function is the single place
 * to fix once the real shape is confirmed (e.g. from a browser Network
 * tab capture of the real /auth/login response).
 */
function extractAuthToken(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const r = response as Record<string, unknown>;

  // Common top-level and nested-wrapper locations, roughly in order of
  // how likely each is for a typical ASP.NET Core API response.
  const candidates: unknown[] = [
    r.token,
    r.accessToken,
    r.access_token,
    r.jwt,
    r.jwtToken,
    (r.result as Record<string, unknown> | undefined)?.token,
    (r.result as Record<string, unknown> | undefined)?.accessToken,
    (r.result as Record<string, unknown> | undefined)?.access_token,
    (r.result as Record<string, unknown> | undefined)?.jwtToken,
    (r.data as Record<string, unknown> | undefined)?.token,
    (r.data as Record<string, unknown> | undefined)?.accessToken,
    (r.data as Record<string, unknown> | undefined)?.jwtToken,
    (r.result as Record<string, unknown> | undefined)?.user &&
      (((r.result as Record<string, unknown>).user as Record<string, unknown>)?.token),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return undefined;
}

function mapRegisterFormToApiPayload(form: RegisterFormData): RegisterApiPayload {
  return {
    businessName: form.storeName,
    fullName: form.fullName,
    phoneNumber: form.phone,
    email: form.email,
    password: form.password,
  };
}

/** Maps backend error responses to user-friendly Arabic messages. */
function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }

    // Try to surface a real backend-provided message if present.
    const body = error.body as any | null;
    if (body && typeof body === 'object') {
      let apiMessage = '';
      
      if (typeof body.message === 'string' && body.message.trim()) {
        apiMessage = body.message;
      } else if (body.result && typeof body.result === 'object' && typeof body.result.message === 'string' && body.result.message.trim()) {
        apiMessage = body.result.message;
      }

      if (apiMessage) {
        // Translate common backend errors to Arabic
        if (apiMessage.includes('Phone number is already registered')) {
          return 'رقم الجوال مسجل مسبقاً.';
        }
        if (apiMessage.includes('Email is already registered')) {
          return 'البريد الإلكتروني مسجل مسبقاً.';
        }
        if (apiMessage.includes('Invalid or expired OTP') || apiMessage.includes('Invalid OTP')) {
          return 'الرمز المدخل غير صحيح أو منتهي الصلاحية.';
        }
        if (
          apiMessage.includes('Invalid credentials') ||
          apiMessage.includes('Unauthorized') ||
          apiMessage.includes('invalid_grant') ||
          apiMessage.includes('incorrect')
        ) {
          return 'رقم الجوال أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
        }
        if (apiMessage.includes('Password') || apiMessage.includes('Passwords')) {
          let translatedMessage = apiMessage;
          translatedMessage = translatedMessage.replace(/Passwords must be at least \d+ characters\./g, 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
          translatedMessage = translatedMessage.replace(/Passwords must have at least one non alphanumeric character\./g, 'يجب أن تحتوي كلمة المرور على رمز واحد على الأقل (مثل @، #، $).');
          translatedMessage = translatedMessage.replace(/Passwords must have at least one lowercase \('a'-'z'\)\./g, 'يجب أن تحتوي كلمة المرور على حرف إنجليزي صغير واحد على الأقل (a-z).');
          translatedMessage = translatedMessage.replace(/Passwords must have at least one uppercase \('A'-'Z'\)\./g, 'يجب أن تحتوي كلمة المرور على حرف إنجليزي كبير واحد على الأقل (A-Z).');
          translatedMessage = translatedMessage.replace(/Passwords must have at least one digit \('0'-'9'\)\./g, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9).');
          return translatedMessage;
        }
        return apiMessage;
      }

      if (body.errors) {
        const errors = body.errors;
        const firstMessage = Array.isArray(errors)
          ? errors[0]
          : Object.values(errors).flat()[0];
        if (typeof firstMessage === 'string' && firstMessage.trim()) {
          return firstMessage;
        }
      }
    }

    if (error.status === 400) {
      return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'رقم الجوال أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
    }
    if (error.status === 409) {
      return 'يوجد حساب مسجل بالفعل بهذه البيانات.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر إتمام العملية. يرجى المحاولة مرة أخرى.';
  }

  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

export async function registerUser(form: RegisterFormData): Promise<AuthResult> {
  const payload = mapRegisterFormToApiPayload(form);

  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/register', payload);

    // The response contract isn't confirmed either, so we don't assume a
    // token means "log the user in" — we just surface it if present, and
    // let the caller decide what to do (per project instructions: don't
    // auto-login/auto-redirect to a dashboard unless the API is confirmed
    // to support it).
    const token = extractAuthToken(response);

    return {
      success: true,
      message: 'تم إنشاء الحساب بنجاح.',
      token,
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST http://whateq.runasp.net/api/auth/login
 *
 * Sends the user's phone number and password to the login endpoint.
 * On success, stores the returned token and resolves with success: true.
 * On failure, maps the backend error to a user-friendly Arabic message.
 */
export async function loginUser(form: LoginFormData): Promise<AuthResult> {
  try {
    const payload = {
      phoneNumber: form.phone,
      password: form.password,
    };

    const response = await httpClient.post<AuthApiResponseShape>('/auth/login', payload);

    const token = extractAuthToken(response);

    // Token persistence is intentionally NOT done here. The caller
    // (LoginPage) hands the token to AuthContext's login(), which is the
    // single place that writes to storage and updates auth state — so
    // isAuthenticated is never out of sync with what's actually stored.
    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      token,
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

export async function verifyOtp(data: { email: string; otp: string }): Promise<AuthResult> {
  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/verify-otp', data);
    
    return {
      success: true,
      message: 'تم التحقق من الرمز بنجاح.',
      token: extractAuthToken(response),
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST /api/Auth/resend-verification-code
 * Resends the verification code for email confirmation during registration.
 */
export async function resendVerificationCode(email: string): Promise<AuthResult> {
  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/resend-verification-code', { email });

    return {
      success: true,
      message: response?.message ?? 'تمت إعادة إرسال رمز التحقق بنجاح.',
      token: extractAuthToken(response),
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST /api/Auth/forgot-password
 * Sends an OTP verification code to the given email address.
 */
export async function forgotPassword(email: string): Promise<AuthResult> {
  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/forgot-password', { email });

    return {
      success: true,
      message: response?.message ?? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
      token: extractAuthToken(response),
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST /api/Auth/verify-reset-otp
 * Validates the OTP sent for resetting the password.
 */
export async function verifyResetOtp(data: { email: string; otp: string }): Promise<AuthResult> {
  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/verify-reset-otp', data);

    return {
      success: true,
      message: response?.message ?? 'تم التحقق من رمز الاستعادة بنجاح.',
      token: extractAuthToken(response),
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST /api/Auth/reset-password
 * Updates the user's password with the new password.
 */
export async function resetPassword(data: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResult> {
  try {
    const response = await httpClient.post<AuthApiResponseShape>('/auth/reset-password', data);

    return {
      success: true,
      message: response?.message ?? 'تم تحديث كلمة المرور بنجاح.',
      token: extractAuthToken(response),
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}

/**
 * POST /api/Auth/logout
 * Logs out the user and clears stored credentials.
 */
export async function logoutUser(): Promise<void> {
  try {
    await httpClient.post('/auth/logout', {});
  } catch {
    // Ignore server error on logout
  } finally {
    clearStoredToken();
  }
}


