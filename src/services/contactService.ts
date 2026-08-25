import { httpClient, ApiError } from '../api/httpClient';
import type { ContactFormData, ContactResult } from '../types/contact';

/**
 * ⚠️ UNVERIFIED BACKEND CONTRACT
 *
 * No Contact Us API endpoint exists anywhere in this project (checked
 * src/api, src/services, src/config/env.ts — only /auth/* endpoints are
 * referenced). Per the project instructions, we do not invent a backend
 * endpoint or fabricate a response contract.
 *
 * This function reuses the existing httpClient (src/api/httpClient.ts)
 * exactly the way registerUser/loginUser/verifyOtp already do in
 * authService.ts, posting to a conventional '/contact-us' path so the
 * form is API-ready the moment a real endpoint is confirmed. Until then,
 * it fails gracefully (network error, 404, etc.) without breaking the UI,
 * matching the same defensive pattern already used for the unconfirmed
 * /auth/register contract.
 */
export async function submitContactForm(form: ContactFormData): Promise<ContactResult> {
  try {
    await httpClient.post('/contact-us', {
      fullName: form.fullName,
      email: form.email,
      inquiryType: form.inquiryType,
      message: form.message,
    });

    return {
      success: true,
      message: 'تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت ممكن.',
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return {
        success: false,
        message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
      };
    }

    return {
      success: false,
      message: 'تعذر إرسال رسالتك حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
    };
  }
}
