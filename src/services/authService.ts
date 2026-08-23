import { httpClient, ApiError } from '../api/httpClient';
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
 * No Swagger/OpenAPI doc, backend source, or Postman collection for
 * POST /api/auth/register was found or provided, so this mapping is a
 * best-effort based only on the existing form's own field names. It is
 * intentionally isolated in this ONE function so that once the real DTO
 * is confirmed, this is the only place that needs to change.
 */
function mapRegisterFormToApiPayload(form: RegisterFormData): RegisterApiPayload {
  return {
    storeName: form.storeName,
    fullName: form.fullName,
    phone: form.phone,
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
    const body = error.body as AuthApiResponseShape | null;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
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
    const token = response?.token ?? response?.accessToken;

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
 * ⚠️ LOGIN API STATUS: NOT AVAILABLE.
 *
 * The project was searched for an existing login endpoint, auth service,
 * or any reference to POST /api/auth/login — none was found, and none was
 * provided in the task. Per project instructions ("If no login endpoint
 * can be verified: DO NOT INVENT ONE"), this function is API-ready
 * (correct shape, correct separation from the UI, correct error handling
 * pattern) but does not call a fabricated endpoint.
 *
 * Once the real login endpoint is confirmed, replace the body of this
 * function with:
 *   const response = await httpClient.post<AuthApiResponseShape>('/auth/login', payload);
 * and map the response the same way registerUser does above.
 */
// `_form` is intentionally accepted (unused for now, hence the leading
// underscore both TS and ESLint recognize as "intentionally unused") so
// this function already has the correct real signature the moment a
// login endpoint is confirmed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loginUser(_form: LoginFormData): Promise<AuthResult> {
  // Once the real login endpoint is confirmed, replace this body with:
  //
  //   const payload = { phone: _form.phone, password: _form.password };
  //   const response = await httpClient.post<AuthApiResponseShape>('/auth/login', payload);
  //   ...map response the same way registerUser does above, return { success: true, ... }
  //
  // and catch errors the same way with toFriendlyErrorMessage(error).
  return {
    success: false,
    message: 'تسجيل الدخول عبر الخادم غير متاح حالياً. سيتم تفعيله عند توفر واجهة الدخول (API).',
  };
}
