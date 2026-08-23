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

    const token = response?.token ?? response?.accessToken;

    // Persist the token so authenticated requests can attach it.
    if (token) {
      localStorage.setItem('auth_token', token);
    }

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
      token: response?.token ?? response?.accessToken,
    };
  } catch (error) {
    return {
      success: false,
      message: toFriendlyErrorMessage(error),
    };
  }
}
