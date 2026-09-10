import { httpClient, ApiError } from '../api/httpClient';
import type {
  DeletePaymentResponseDto,
  NewPaymentFormState,
  PaymentMethod,
  RegisterPaymentResponseDto,
  UpdatePaymentResponseDto,
} from '../types/payment';

/**
 * Client-side mirror of the amount rule for this form: required, numeric,
 * and strictly greater than zero, with at most 2 decimal places. Mirrors the style of
 * validateCustomerFullName / validateDebtAmount elsewhere in the codebase.
 */
export function validatePaymentAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'مبلغ الدفعة مطلوب.';
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return 'يرجى إدخال مبلغ صحيح.';
  if (numeric <= 0) return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين.';
  }
  return null;
}

/**
 * Client-side pre-check mirroring the backend's own restriction ("Payment
 * amount cannot exceed the customer's remaining debt"). Optional —
 * `remainingDebt` is only passed once the customer's profile has loaded —
 * but catches the obvious case before a round trip to the server.
 */
export function validatePaymentAmountAgainstBalance(
  value: string,
  remainingDebt: number
): string | null {
  const numeric = Number(value.trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return null; // validatePaymentAmount already covers this
  if (numeric > remainingDebt) {
    return `لا يمكن أن تتجاوز الدفعة المبلغ المتبقي على العميل (الحد الأقصى ${remainingDebt.toFixed(2)}).`;
  }
  return null;
}

const MAX_RECEIPT_NUMBER_LENGTH = 50;

/** Optional field — max 50 characters per the API contract. */
export function validateReceiptNumber(value: string): string | null {
  if (value.length > MAX_RECEIPT_NUMBER_LENGTH) {
    return 'رقم الإيصال طويل جداً (الحد الأقصى 50 حرفاً).';
  }
  return null;
}

const MAX_NOTES_LENGTH = 500;

/** Optional field — max 500 characters per the API contract (payments use
 * a shorter limit than debts' notes field). */
export function validatePaymentNotes(value: string): string | null {
  if (value.length > MAX_NOTES_LENGTH) {
    return 'لا يمكن أن تتجاوز الملاحظات 500 حرف.';
  }
  return null;
}

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per the upload area's own label
const ALLOWED_RECEIPT_TYPES = ['image/png', 'image/jpeg'];

/** Mirrors the "حتى 5 ميجابايت، PNG, JPG" limit shown under the upload area. */
export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'صيغة الملف غير مدعومة. الرجاء رفع صورة PNG أو JPG.';
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.';
  }
  return null;
}

/**
 * POST http://whateq.runasp.net/api/Debt/registerPayment
 *
 * Maps the friendly string PaymentMethod the UI works with to the wire
 * enum value (1 = Cash, 2 = BankTransfer, 3 = CreditCard). There is no
 * "wallet" method in the real API — see the note on PaymentMethod in
 * types/payment.ts.
 */
export const PAYMENT_METHOD_TO_NUMERIC: Record<PaymentMethod, number> = {
  cash: 1,
  bank_transfer: 2,
  credit_card: 3,
};

const REGISTER_PAYMENT_PATH = '/Debt/registerPayment';

/**
 * Builds the multipart/form-data body exactly as documented: customerId,
 * amount and paymentMethod are always sent; receiptNumber, notes and
 * receiptImage are only appended when actually provided (an empty/absent
 * optional field is simply left out of the FormData, never sent as an
 * empty string). No debtId (this endpoint distributes across all of the
 * customer's outstanding debts) and no userId/paymentDate — both are
 * backend-only per the contract.
 */
function buildRegisterPaymentFormData(customerId: string, values: NewPaymentFormState): FormData {
  const formData = new FormData();
  formData.append('customerId', customerId);
  formData.append('amount', values.amount.trim());
  formData.append('paymentMethod', String(PAYMENT_METHOD_TO_NUMERIC[values.method]));

  const receiptNumber = values.receiptNumber?.trim();
  if (receiptNumber) formData.append('receiptNumber', receiptNumber);

  const notes = values.notes.trim();
  if (notes) formData.append('notes', notes);

  if (values.receiptFile) formData.append('receiptImage', values.receiptFile);

  return formData;
}

export async function registerPayment(
  customerId: string,
  values: NewPaymentFormState
): Promise<RegisterPaymentResponseDto> {
  const formData = buildRegisterPaymentFormData(customerId, values);
  // Diagnostic only — mirrors the [createDebt]/[updateDebt] logging style
  // elsewhere in the codebase. FormData entries are logged individually
  // since FormData itself doesn't stringify usefully.
  // eslint-disable-next-line no-console
  console.log(
    '[registerPayment] POST',
    REGISTER_PAYMENT_PATH,
    Object.fromEntries(formData.entries())
  );
  return httpClient.postForm<RegisterPaymentResponseDto>(REGISTER_PAYMENT_PATH, formData);
}

/** Maps registerPayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toRegisterPaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[registerPayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
        ? body
        : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Customer not found')) {
      return 'تعذر العثور على هذا العميل.';
    }
    if (message.includes('has no outstanding debts to pay')) {
      return 'لا توجد ديون مستحقة على هذا العميل حالياً.';
    }
    if (message.includes('cannot exceed')) {
      // The backend embeds the max allowed amount in its own message
      // ("...Maximum allowed payment is {amount}."); surface that verbatim
      // since it's a real, useful number rather than re-deriving it.
      return `قيمة الدفعة أكبر من المبلغ المتبقي على العميل. ${message}`;
    }
    if (message.includes('Payment amount must be greater than zero')) {
      return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
    }
    if (message.includes('A valid customer is required')) {
      return 'يجب اختيار عميل صحيح.';
    }
    if (message.includes('A valid payment method is required')) {
      return 'يرجى اختيار طريقة دفع صحيحة.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية تنفيذ هذا الإجراء.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على البيانات المطلوبة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حفظ الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Delete Payment — DELETE /api/Payment/{id}                               */
/*                                                                          */
/* Per the documented contract, deleting a payment is a single call with   */
/* no request body and no confirmation step (unlike Delete Debt): the      */
/* backend recalculates the debt's PaidAmount/Status and the customer's    */
/* TotalDebt, and removes the receipt image only if no other payment still */
/* references it. No UserId is ever sent — the backend extracts it from    */
/* the JWT.                                                                */
/* ---------------------------------------------------------------------- */

const deletePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function deletePayment(paymentId: string | number): Promise<DeletePaymentResponseDto> {
  return httpClient.delete<DeletePaymentResponseDto>(deletePaymentPath(paymentId));
}

/** Maps deletePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toDeletePaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[deletePayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
        ? body
        : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Payment not found')) {
      return 'تعذر العثور على هذه الدفعة. قد تكون قد حُذفت بالفعل.';
    }
    if (message.includes('A valid payment is required')) {
      return 'معرّف الدفعة غير صالح.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية حذف هذه الدفعة.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على هذه الدفعة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حذف الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Update Payment — PUT /api/Payment/{id}                                 */
/*                                                                        */
/* Allows the merchant to update a previously registered payment amount.  */
/* Backend distributes overflow across the customer's other debts and     */
/* recalculates status and totalDebt. No userId or paymentId in the body; */
/* Payment ID is passed in the URL path.                                  */
/* ---------------------------------------------------------------------- */

const updatePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function updatePayment(
  paymentId: string | number,
  newAmount: number,
  paymentMethod?: number
): Promise<UpdatePaymentResponseDto> {
  const payload: { newAmount: number; paymentMethod?: number } = { newAmount };
  if (paymentMethod !== undefined) {
    payload.paymentMethod = paymentMethod;
  }
  return httpClient.put<UpdatePaymentResponseDto>(updatePaymentPath(paymentId), payload);
}

/** Maps updatePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toUpdatePaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[updatePayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
        ? body
        : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Payment not found')) {
      return 'تعذر العثور على هذه الدفعة. قد تكون قد حُذفت بالفعل.';
    }
    if (message.includes('User identification is required')) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.';
    }
    if (message.includes('A valid payment is required')) {
      return 'معرّف الدفعة غير صالح.';
    }
    if (message.includes('Payment amount must be greater than zero')) {
      return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
    }
    if (message.includes('at most 18 digits and 2 decimal places')) {
      return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين.';
    }
    if (message.includes('cannot exceed the maximum allowed amount')) {
      return `مبلغ الدفعة يتجاوز الحد الأقصى المسموح به. ${message}`;
    }
    if (message.includes('Payment could not be updated. No changes were saved')) {
      return 'تعذر تعديل الدفعة. لم يتم حفظ أي تغييرات.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return message || 'يرجى التحقق من القيمة المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية تعديل هذه الدفعة.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على الدفعة المطلوبة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم أثناء تعديل الدفعة. يرجى المحاولة لاحقاً.';
    }
    return message || 'تعذر تعديل الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

