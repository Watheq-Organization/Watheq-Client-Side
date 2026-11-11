import { httpClient, ApiError } from '../api/httpClient';
import { getCustomerProfile } from './customerService';
import { getCurrencyConfig, getCurrencyId, normalizeCurrencyCode } from '../utils/currency';
import type {
  DeletePaymentResponseDto,
  NewPaymentFormState,
  PaymentMethod,
  PaymentHistoryItemDto,
  PaymentHistoryQueryParams,
  PaymentHistoryResult,
  RegisterPaymentResponseDto,
  UpdatePaymentResponseDto,
} from '../types/payment';

export interface PaymentFieldErrors {
  amount?: string;
  paymentDate?: string;
  notes?: string;
  receipt?: string;
  currency?: string;
  method?: string;
}

export interface ParsedPaymentApiError {
  generalMessage: string;
  fieldErrors: PaymentFieldErrors;
  details: string[];
}

/**
 * Client-side mirror of the amount rule for this form: required, numeric,
 * and strictly greater than zero, with at most 2 decimal places.
 */
export function validatePaymentAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'مبلغ الدفعة مطلوب؛ يرجى إدخال القيمة المستلمة.';
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return 'يرجى إدخال مبلغ صحيح بالأرقام فقط.';
  if (numeric <= 0) return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين (مثال: 25.50).';
  }
  return null;
}

/**
 * Client-side pre-check mirroring the backend's own restriction ("Payment
 * amount cannot exceed the customer's remaining debt") and preventing zero-debt
 * submissions for the selected currency.
 */
export function validatePaymentAmountAgainstBalance(
  value: string,
  remainingDebt: number,
  currencyCode?: string
): string | null {
  const numeric = Number(value.trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return null; // validatePaymentAmount already covers this

  const currencyLabel = currencyCode ? getCurrencyConfig(currencyCode).labelArFull : null;
  const currencySymbol = currencyCode ? getCurrencyConfig(currencyCode).symbol : '';

  if (remainingDebt <= 0) {
    return currencyLabel
      ? `لا توجد ديون قائمة مستحقة على العميل بعملة ${currencyLabel} لتسجيل دفعة عليها.`
      : 'لا توجد ديون قائمة مستحقة على هذا العميل لتسجيل دفعة عليها.';
  }

  if (numeric > remainingDebt) {
    const formattedMax = remainingDebt.toLocaleString('en-US', {
      minimumFractionDigits: remainingDebt % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return currencyLabel
      ? `لا يمكن أن تتجاوز الدفعة المديونية المستحقة بعملة ${currencyLabel} (الحد الأقصى المتاح: ${formattedMax} ${currencySymbol}).`
      : `لا يمكن أن تتجاوز الدفعة المبلغ المتبقي على العميل (الحد الأقصى: ${formattedMax}).`;
  }
  return null;
}

/** Validates payment date input (must be non-empty valid YYYY-MM-DD date). */
export function validatePaymentDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'يرجى تحديد تاريخ الدفع.';
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return 'صيغة تاريخ الدفع غير صحيحة؛ يرجى اختيار تاريخ صالح.';
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

/** Optional field — max 500 characters per the API contract. */
export function validatePaymentNotes(value: string): string | null {
  if (value.length > MAX_NOTES_LENGTH) {
    return 'الملاحظات المدخلة تتجاوز الحد المسموح (500 حرف).';
  }
  return null;
}

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per the upload area's own label
const ALLOWED_RECEIPT_TYPES = ['image/png', 'image/jpeg'];

/** Mirrors the "حتى 5 ميجابايت، PNG, JPG" limit shown under the upload area. */
export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'صيغة ملف الإيصال غير مدعومة. المسموح صور PNG أو JPG فقط.';
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return 'حجم صورة الإيصال أكبر من الحد المسموح (الحد الأقصى 5 ميجابايت).';
  }
  return null;
}

/**
 * POST https://whateq.runasp.net/api/Debt/registerPayment
 *
 * Maps the friendly string PaymentMethod the UI works with to the wire
 * enum value (1 = Cash, 2 = BankTransfer, 3 = CreditCard).
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
 * receiptImage are only appended when actually provided. DebtId is sent
 * empty per backend contract requirements.
 */
function buildRegisterPaymentFormData(customerId: string, values: NewPaymentFormState): FormData {
  const formData = new FormData();
  formData.append('CustomerId', customerId);
  formData.append('customerId', customerId);
  formData.append('Amount', values.amount.trim());
  formData.append('amount', values.amount.trim());
  const methodNum = String(PAYMENT_METHOD_TO_NUMERIC[values.method] || 1);
  formData.append('PaymentMethod', methodNum);
  formData.append('paymentMethod', methodNum);

  // Multi-Currency support: send CurrencyId (numeric) and CurrencyCode / Currency (string)
  // in both PascalCase and camelCase to satisfy any backend model binder variant.
  const currencyCode = normalizeCurrencyCode(values.currencyCode || values.currency || 'ILS');
  const currencyId = values.currencyId ?? getCurrencyId(currencyCode);
  formData.append('CurrencyId', String(currencyId));
  formData.append('currencyId', String(currencyId));
  formData.append('CurrencyCode', currencyCode);
  formData.append('currencyCode', currencyCode);
  formData.append('Currency', currencyCode);
  formData.append('currency', currencyCode);

  // Do not send any value for debtId, keep it empty per API requirements
  formData.append('DebtId', '');
  formData.append('debtId', '');

  const receiptNumber = values.receiptNumber?.trim();
  if (receiptNumber) {
    formData.append('ReceiptNumber', receiptNumber);
    formData.append('receiptNumber', receiptNumber);
  }

  const notes = values.notes?.trim();
  if (notes) {
    formData.append('Notes', notes);
    formData.append('notes', notes);
  }

  if (values.receiptFile) {
    formData.append('ReceiptImage', values.receiptFile);
    formData.append('receiptImage', values.receiptFile);
  }

  return formData;
}

export async function registerPayment(
  customerId: string,
  values: NewPaymentFormState
): Promise<RegisterPaymentResponseDto> {
  const formData = buildRegisterPaymentFormData(customerId, values);
  console.log(
    '[registerPayment] POST',
    REGISTER_PAYMENT_PATH,
    Object.fromEntries(formData.entries())
  );
  return httpClient.postForm<RegisterPaymentResponseDto>(REGISTER_PAYMENT_PATH, formData);
}

function detectCurrencyLabelInMessage(rawMsg: string): string | null {
  const upper = rawMsg.toUpperCase();
  if (upper.includes('ILS') || rawMsg.includes('شيكل')) return 'الشيكل (ILS)';
  if (upper.includes('USD') || rawMsg.includes('دولار')) return 'الدولار الأمريكي (USD)';
  if (upper.includes('EUR') || rawMsg.includes('يورو')) return 'اليورو (EUR)';
  if (upper.includes('GBP') || rawMsg.includes('جنيه')) return 'الجنيه الإسترليني (GBP)';
  if (upper.includes('JOD') || rawMsg.includes('دينار')) return 'الدينار الأردني (JOD)';
  return null;
}

/**
 * Translates raw backend payment error messages (or ASP.NET validation messages)
 * into explicit Arabic explanations without discarding real server details.
 */
function translatePaymentBackendMessage(rawMsg: string, fieldHint?: string): string {
  const trimmed = rawMsg.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const lowerField = (fieldHint || '').toLowerCase();

  if (lower.includes('no business found for the current merchant')) {
    return 'لا يوجد نشاط تجاري مرتبط بحسابك التاجر. يرجى التواصل مع الدعم الفني.';
  }
  if (lower.includes('user identification is required') || lower.includes('unauthorized')) {
    return 'انتهت صلاحية الجلسة أو تعذر التحقق من هوية التاجر. يرجى تسجيل الدخول مرة أخرى.';
  }
  if (lower.includes('customer not found')) {
    return 'تعذر العثور على هذا العميل في السجل.';
  }
  if (lower.includes('a valid customer is required') || lowerField.includes('customer')) {
    return 'معرّف العميل غير صالح أو مفقود.';
  }
  if (lower.includes('payment not found')) {
    return 'تعذر العثور على هذه الدفعة. قد تكون قد حُذفت بالفعل.';
  }
  if (lower.includes('a valid payment is required')) {
    return 'معرّف الدفعة غير صالح أو غير متوفر.';
  }
  if (
    lower.includes('has no outstanding debts') ||
    lower.includes('no outstanding debt') ||
    lower.includes('no pending debt') ||
    lower.includes('no open debt') ||
    lower.includes('no active debt')
  ) {
    const detectedCurrency = detectCurrencyLabelInMessage(trimmed);
    return detectedCurrency
      ? `لا توجد ديون قائمة مستحقة على هذا العميل بعملة ${detectedCurrency} لسدادها.`
      : 'لا توجد ديون قائمة مستحقة السداد على هذا العميل بالعملة المختارة.';
  }
  if (
    lower.includes('cannot exceed') ||
    lower.includes('exceeds') ||
    lower.includes('greater than remaining') ||
    lower.includes('more than') ||
    lower.includes('maximum allowed')
  ) {
    const numMatch = trimmed.match(/(\d+(?:[.,]\d+)?)/);
    return `قيمة الدفعة أكبر من المبلغ المتبقي على العميل${
      numMatch ? ` (الحد الأقصى المسموح: ${numMatch[1]})` : ''
    }.`;
  }
  if (lower.includes('payment could not be updated') || lower.includes('no changes were saved')) {
    return 'تعذر تعديل الدفعة. لم يتم حفظ أي تغييرات.';
  }
  if (lower.includes('greater than zero') || lower.includes('must be > 0') || lower.includes('positive')) {
    return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
  }
  if (lower.includes('at most 18 digits') || lower.includes('2 decimal') || lower.includes('decimal places')) {
    return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين.';
  }
  if (
    lower.includes('a valid payment method is required') ||
    lowerField.includes('paymentmethod') ||
    lowerField === 'method'
  ) {
    return 'طريقة الدفع المختارة غير صالحة. يرجى اختيار (نقدي، تحويل بنكي، أو محفظة/بطاقة).';
  }
  if (lowerField.includes('currency') || lower.includes('currency')) {
    if (lower.includes('mismatch') || lower.includes('different') || lower.includes('match')) {
      return 'عملة الدفعة المختارة لا تطابق عملة الدين المسجلة على العميل.';
    }
    return 'العملة المختارة غير صالحة أو غير مفعّلة في النظام.';
  }
  if (lowerField.includes('debt') || lower.includes('debt not found')) {
    return 'الدين المرتبط غير موجود أو تم سداده بالكامل بالفعل.';
  }
  if (lowerField.includes('receiptnumber') || lower.includes('receipt number')) {
    if (lower.includes('duplicate') || lower.includes('exists') || lower.includes('already')) {
      return 'رقم الإيصال مستخدم مسبقاً في عملية أخرى.';
    }
    return 'رقم الإيصال غير صالح أو يتجاوز الطول المسموح (50 حرفاً).';
  }
  if (
    lowerField.includes('receiptimage') ||
    lowerField.includes('image') ||
    lower.includes('file') ||
    lower.includes('extension')
  ) {
    return 'ملف الإيصال المرفق غير صالح (يدعم صور PNG أو JPG بحد أقصى 5 ميجابايت).';
  }
  if (lowerField.includes('notes') || lower.includes('notes')) {
    return 'الملاحظات المدخلة تتجاوز الحد المسموح (500 حرف).';
  }
  if (lowerField.includes('date') || lower.includes('paymentdate')) {
    return 'تاريخ الدفع غير صالح؛ يرجى التحقق من التاريخ المدخل.';
  }
  if (lowerField.includes('amount') || lower.includes('amount')) {
    if (lower.includes('required')) {
      return 'حقل مبلغ الدفعة مطلوب.';
    }
    return 'قيمة مبلغ الدفعة المدخلة غير صالحة؛ يرجى التحقق من الرقم.';
  }
  if (lower === 'one or more validation errors occurred.') {
    return 'يوجد خطأ في التحقق من صحة البيانات المدخلة.';
  }

  // If the server already sent an Arabic error string, return it verbatim.
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }

  // Never hide an unrecognized backend message behind a vague generic string.
  return `رفض الخادم الطلب: ${trimmed}`;
}

function assignPaymentFieldError(
  fieldErrors: PaymentFieldErrors,
  translatedMsg: string,
  fieldHint?: string
): void {
  const key = (fieldHint || '').toLowerCase();
  const msgLower = translatedMsg.toLowerCase();

  if (key.includes('amount') || msgLower.includes('مبلغ') || msgLower.includes('الدفعة أكبر')) {
    if (!fieldErrors.amount) fieldErrors.amount = translatedMsg;
    return;
  }
  if (key.includes('currency') || msgLower.includes('عملة')) {
    if (!fieldErrors.currency) fieldErrors.currency = translatedMsg;
    return;
  }
  if (key.includes('paymentmethod') || key === 'method' || msgLower.includes('طريقة الدفع')) {
    if (!fieldErrors.method) fieldErrors.method = translatedMsg;
    return;
  }
  if (key.includes('date') || msgLower.includes('تاريخ الدفع')) {
    if (!fieldErrors.paymentDate) fieldErrors.paymentDate = translatedMsg;
    return;
  }
  if (key.includes('notes') || msgLower.includes('ملاحظات')) {
    if (!fieldErrors.notes) fieldErrors.notes = translatedMsg;
    return;
  }
  if (key.includes('receiptimage') || key.includes('image') || msgLower.includes('إيصال')) {
    if (!fieldErrors.receipt) fieldErrors.receipt = translatedMsg;
  }
}

function normalizeErrorBody(rawBody: unknown): unknown {
  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return rawBody;
      }
    }
  }
  return rawBody;
}

/**
 * Unified error parser for Payment API endpoints (`registerPayment`, `updatePayment`, `deletePayment`).
 * Extracts ASP.NET ValidationProblemDetails, JSON strings, nested `data`/`result` messages,
 * maps each error to its form field, and guarantees a clear Arabic explanation.
 */
function parsePaymentApiError(
  error: unknown,
  context: 'register' | 'update' | 'delete'
): ParsedPaymentApiError {
  const fieldErrors: PaymentFieldErrors = {};
  const details: string[] = [];

  const pushUniqueDetail = (msg: string, fieldHint?: string) => {
    const clean = msg.trim();
    if (!clean) return;
    if (!details.includes(clean)) {
      details.push(clean);
    }
    assignPaymentFieldError(fieldErrors, clean, fieldHint);
  };

  if (!(error instanceof ApiError)) {
    return {
      generalMessage: 'حدث خطأ غير متوقع في التطبيق. يرجى المحاولة مرة أخرى.',
      fieldErrors,
      details,
    };
  }

  console.error(`[${context}Payment] backend responded with an error:`, {
    status: error.status,
    body: error.body,
  });

  if (error.status === 0) {
    return {
      generalMessage: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
      fieldErrors,
      details,
    };
  }
  if (error.status === 408 || error.message === 'TIMEOUT') {
    return {
      generalMessage: 'انتهت مهلة انتظار استجابة الخادم. يرجى المحاولة مرة أخرى.',
      fieldErrors,
      details,
    };
  }
  if (error.status === 401) {
    return {
      generalMessage: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      fieldErrors,
      details,
    };
  }

  const normalizedBody = normalizeErrorBody(error.body);

  if (typeof normalizedBody === 'string' && normalizedBody.trim()) {
    pushUniqueDetail(translatePaymentBackendMessage(normalizedBody));
  } else if (Array.isArray(normalizedBody)) {
    for (const item of normalizedBody) {
      if (typeof item === 'string' && item.trim()) {
        pushUniqueDetail(translatePaymentBackendMessage(item));
      }
    }
  } else if (normalizedBody && typeof normalizedBody === 'object') {
    const b = normalizedBody as Record<string, unknown>;

    // 1. ASP.NET ValidationProblemDetails `errors` dictionary or array
    const errorsObj = b.errors ?? b.Errors;
    if (errorsObj && typeof errorsObj === 'object') {
      if (Array.isArray(errorsObj)) {
        for (const item of errorsObj) {
          if (typeof item === 'string' && item.trim()) {
            pushUniqueDetail(translatePaymentBackendMessage(item));
          }
        }
      } else {
        for (const [key, val] of Object.entries(errorsObj as Record<string, unknown>)) {
          const msgs = Array.isArray(val) ? val : [val];
          for (const rawItem of msgs) {
            if (typeof rawItem === 'string' && rawItem.trim()) {
              pushUniqueDetail(translatePaymentBackendMessage(rawItem, key), key);
            }
          }
        }
      }
    }

    // 2. Direct message / detail / error / nested data.message or result.message / title
    const nestedResult = (b.result && typeof b.result === 'object' ? b.result : null) as Record<string, unknown> | null;
    const nestedData = (b.data && typeof b.data === 'object' ? b.data : null) as Record<string, unknown> | null;

    const candidateStrings: unknown[] = [
      b.message,
      b.Message,
      b.detail,
      b.Detail,
      b.error,
      b.Error,
      nestedResult?.message,
      nestedResult?.Message,
      nestedData?.message,
      nestedData?.Message,
    ];

    for (const candidate of candidateStrings) {
      if (typeof candidate === 'string' && candidate.trim()) {
        pushUniqueDetail(translatePaymentBackendMessage(candidate));
      }
    }

    // Title fallback only if no more specific message was found yet
    if (details.length === 0) {
      const rawTitle = b.title ?? b.Title;
      if (typeof rawTitle === 'string' && rawTitle.trim()) {
        pushUniqueDetail(translatePaymentBackendMessage(rawTitle));
      }
    }
  }

  if (details.length > 0) {
    return {
      generalMessage: details.join(' — '),
      fieldErrors,
      details,
    };
  }

  // Clear status-based fallbacks when backend returned an empty body
  if (error.status === 403) {
    return {
      generalMessage: 'لا تملك الصلاحية لتنفيذ هذا الإجراء (403).',
      fieldErrors,
      details,
    };
  }
  if (error.status === 404) {
    return {
      generalMessage:
        context === 'register'
          ? 'تعذر العثور على العميل أو الدين المطلوب في الخادم (404).'
          : 'تعذر العثور على الدفعة المطلوبة في السجل (404).',
      fieldErrors,
      details,
    };
  }
  if (error.status === 409) {
    return {
      generalMessage: 'يوجد تعارض في البيانات المدخلة (409). يرجى تحديث الصفحة والتحقق من رصيد العميل.',
      fieldErrors,
      details,
    };
  }
  if (error.status === 413) {
    return {
      generalMessage: 'حجم صورة الإيصال المرفقة أكبر من الحد المسموح على الخادم (413).',
      fieldErrors: { ...fieldErrors, receipt: 'حجم الملف أكبر من المسموح.' },
      details,
    };
  }
  if (error.status === 415) {
    return {
      generalMessage: 'صيغة الطلب أو نوع الملف المرفق غير مدعوم من الخادم (415).',
      fieldErrors,
      details,
    };
  }
  if (error.status === 400 || error.status === 422) {
    return {
      generalMessage:
        context === 'register'
          ? 'رفض الخادم تسجيل الدفعة؛ تأكد من وجود دين قائم على العميل بالعملة المختارة ومن صحة المبلغ المدخل.'
          : context === 'update'
            ? 'رفض الخادم تعديل الدفعة؛ يرجى التأكد من صحة القيمة الجديدة ومطابقتها للرصيد.'
            : 'تعذر حذف الدفعة بسبب عدم صحة المعرّف أو ارتباطها بعمليات أخرى.',
      fieldErrors,
      details,
    };
  }
  if (error.status >= 500) {
    return {
      generalMessage: `حدث خطأ داخلي في الخادم (${error.status}). يرجى المحاولة مرة أخرى لاحقاً.`,
      fieldErrors,
      details,
    };
  }

  return {
    generalMessage:
      context === 'register'
        ? `تعذر حفظ الدفعة (رمز الخطأ: ${error.status}). يرجى المحاولة مرة أخرى.`
        : context === 'update'
          ? `تعذر تعديل الدفعة (رمز الخطأ: ${error.status}). يرجى المحاولة مرة أخرى.`
          : `تعذر حذف الدفعة (رمز الخطأ: ${error.status}). يرجى المحاولة مرة أخرى.`,
    fieldErrors,
    details,
  };
}

/** Parses registerPayment errors into structured field + general Arabic messages. */
export function parseRegisterPaymentApiError(error: unknown): ParsedPaymentApiError {
  return parsePaymentApiError(error, 'register');
}

/** Parses updatePayment errors into structured field + general Arabic messages. */
export function parseUpdatePaymentApiError(error: unknown): ParsedPaymentApiError {
  return parsePaymentApiError(error, 'update');
}

/** Maps registerPayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toRegisterPaymentErrorMessage(error: unknown): string {
  return parsePaymentApiError(error, 'register').generalMessage;
}

/* ---------------------------------------------------------------------- */
/* Delete Payment — DELETE /api/Payment/{id}                               */
/* ---------------------------------------------------------------------- */

const deletePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function deletePayment(paymentId: string | number): Promise<DeletePaymentResponseDto> {
  const numericId = Number(paymentId);
  if (!paymentId || isNaN(numericId) || numericId <= 0) {
    throw new ApiError('معرّف الدفعة غير صالح أو غير متوفر في السجل.', 400, {
      message: 'A valid payment is required.',
    });
  }
  return httpClient.delete<DeletePaymentResponseDto>(deletePaymentPath(numericId));
}

/** Maps deletePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toDeletePaymentErrorMessage(error: unknown): string {
  return parsePaymentApiError(error, 'delete').generalMessage;
}

/* ---------------------------------------------------------------------- */
/* Update Payment — PUT /api/Payment/{id}                                 */
/* ---------------------------------------------------------------------- */

const updatePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function updatePayment(
  paymentId: string | number,
  newAmount: number,
  paymentMethod?: number,
  notes?: string,
  receiptFile?: File | null
): Promise<UpdatePaymentResponseDto> {
  const numericId = Number(paymentId);
  if (!paymentId || isNaN(numericId) || numericId <= 0) {
    throw new ApiError('معرّف الدفعة غير صالح.', 400, { message: 'A valid payment is required.' });
  }

  const formData = new FormData();
  formData.append('PaymentId', String(numericId));
  formData.append('Amount', String(newAmount));
  if (paymentMethod !== undefined) {
    formData.append('PaymentMethod', String(paymentMethod));
  }
  if (notes) {
    formData.append('Notes', notes.trim());
  }
  if (receiptFile) {
    formData.append('ReceiptImage', receiptFile);
  }

  return httpClient.putForm<UpdatePaymentResponseDto>(updatePaymentPath(numericId), formData);
}

/** Maps updatePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toUpdatePaymentErrorMessage(error: unknown): string {
  return parsePaymentApiError(error, 'update').generalMessage;
}

/* ---------------------------------------------------------------------- */
/* Payment History — GET /api/Payment/history                             */
/* ---------------------------------------------------------------------- */

/**
 * GET https://whateq.runasp.net/api/Payment/history
 *
 * Fetches the payment history for the merchant with optional filters:
 * PaymentMethod, Status, FromDate, ToDate, UserId.
 */
export async function getPaymentHistory(
  params?: PaymentHistoryQueryParams
): Promise<PaymentHistoryResult> {
  try {
    const searchParams = new URLSearchParams();

    if (
      params?.paymentMethod !== undefined &&
      params.paymentMethod !== null &&
      String(params.paymentMethod) !== 'all'
    ) {
      let numMethod: number | undefined;
      if (typeof params.paymentMethod === 'number') {
        numMethod = params.paymentMethod;
      } else {
        const s = String(params.paymentMethod).trim().toLowerCase().replace(/[\s_-]/g, '');
        if (s === '1' || s.includes('cash') || s.includes('نقد')) numMethod = 1;
        else if (s === '2' || s.includes('bank') || s.includes('بنك') || s.includes('تحويل') || s.includes('transfer')) numMethod = 2;
        else if (s === '3' || s.includes('card') || s.includes('credit') || s.includes('محفظ') || s.includes('مدى') || s.includes('بطاق')) numMethod = 3;
      }
      if (numMethod !== undefined) {
        searchParams.append('PaymentMethod', String(numMethod));
      }
    }

    if (
      params?.status !== undefined &&
      params.status !== null &&
      String(params.status) !== 'all'
    ) {
      searchParams.append('Status', String(params.status));
    }

    // Always provide safe default dates if omitted so ASP.NET required DateTime parameters never fail with 400
    const fromDate = params?.fromDate || '2020-01-01T00:00:00Z';
    const toDate = params?.toDate || new Date(Date.now() + 86400000).toISOString();
    searchParams.append('FromDate', fromDate);
    searchParams.append('ToDate', toDate);

    if (params?.userId) {
      searchParams.append('UserId', params.userId);
    }

    if (params?.currencyId) {
      searchParams.append('CurrencyId', String(params.currencyId));
    } else if (params?.currencyCode) {
      searchParams.append('CurrencyId', String(getCurrencyId(params.currencyCode)));
    }

    const queryString = searchParams.toString();
    const primaryUrl = `/Debt/getPaymentHistory${queryString ? `?${queryString}` : ''}`;
    const fallbackUrl = `/Payment/history${queryString ? `?${queryString}` : ''}`;
    console.log('[getPaymentHistory] Fetching:', primaryUrl);

    let response: unknown;
    try {
      response = await httpClient.get<unknown>(primaryUrl);
      console.log('[getPaymentHistory] Raw API response from /Debt/getPaymentHistory:', response);
    } catch (primaryErr) {
      console.warn('[getPaymentHistory] /Debt/getPaymentHistory failed, falling back to /Payment/history:', primaryErr);
      response = await httpClient.get<unknown>(fallbackUrl);
      console.log('[getPaymentHistory] Raw API response from /Payment/history fallback:', response);
    }

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

    console.log('[getPaymentHistory] Raw items received from /Payment/history:', rawItems);

    const items: PaymentHistoryItemDto[] = rawItems.map((item) => {
      const it = (item || {}) as Record<string, unknown>;
      const id = it.id ?? it.paymentId ?? it.PaymentId;
      const customerId = it.customerId ?? it.CustomerId;
      const customerName = String(
        it.customerName ?? it.CustomerName ?? it.customerFullName ?? ''
      );
      const amount = Number(it.amount ?? it.Amount ?? 0);
      const paymentDate = String(
        it.paymentDate ?? it.PaymentDate ?? it.date ?? it.Date ?? it.createdAt ?? ''
      );
      const rawMethod =
        it.paymentMethod ??
        it.PaymentMethod ??
        it.paymentMethodName ??
        it.PaymentMethodName ??
        it.paymentType ??
        it.PaymentType ??
        it.paymentMode ??
        it.PaymentMode ??
        it.method ??
        it.Method;

      let paymentMethod: string | number | null = null;
      if (typeof rawMethod === 'number' || typeof rawMethod === 'string') {
        paymentMethod = rawMethod;
      } else if (typeof rawMethod === 'object' && rawMethod !== null) {
        const obj = rawMethod as Record<string, unknown>;
        const val = obj.name ?? obj.Name ?? obj.value ?? obj.id;
        if (typeof val === 'string' || typeof val === 'number') {
          paymentMethod = val;
        }
      }

      const status = String(it.status ?? it.Status ?? 'تم التحقق');
      const receiptNumber = it.receiptNumber ? String(it.receiptNumber) : undefined;
      const receiptImageUrl = (it.receiptImageUrl ??
        it.ReceiptImageUrl ??
        it.receiptImage ??
        null) as string | null;
      const notes = it.notes ? String(it.notes) : null;

      const rawCurrency =
        it.currencyCode ??
        it.CurrencyCode ??
        it.currency ??
        it.Currency ??
        it.currencyId ??
        it.CurrencyId;
      const currencyConfig = getCurrencyConfig(rawCurrency);

      return {
        id: id !== undefined ? String(id) : undefined,
        paymentId: id !== undefined ? String(id) : undefined,
        customerId: customerId !== undefined ? String(customerId) : undefined,
        customerName,
        amount,
        currency: currencyConfig.code,
        currencyCode: currencyConfig.code,
        currencyId: currencyConfig.id,
        paymentDate,
        date: paymentDate,
        paymentMethod,
        status,
        receiptNumber,
        receiptImageUrl,
        notes,
      };
    });

    // Enrich items with true paymentMethod from customer profile transactions
    const uniqueCustomerIds = Array.from(
      new Set(items.map((i) => i.customerId).filter(Boolean))
    );

    if (uniqueCustomerIds.length > 0) {
      try {
        const profiles = await Promise.all(
          uniqueCustomerIds.map((cid) => getCustomerProfile(String(cid)).catch(() => null))
        );
        const txMap = new Map<string, string>();
        for (const p of profiles) {
          if (!p || !Array.isArray(p.transactions)) continue;
          for (const tx of p.transactions) {
            if (tx.paymentMethod) {
              if (tx.id) txMap.set(String(tx.id), tx.paymentMethod);
              if (tx.reference) txMap.set(String(tx.reference), tx.paymentMethod);
              txMap.set(`${p.id}_${tx.amount}`, tx.paymentMethod);
            }
          }
        }

        for (const it of items) {
          const matchedMethod =
            (it.paymentId ? txMap.get(String(it.paymentId)) : undefined) ??
            (it.id ? txMap.get(String(it.id)) : undefined) ??
            (it.receiptNumber ? txMap.get(String(it.receiptNumber)) : undefined) ??
            (it.customerId ? txMap.get(`${it.customerId}_${it.amount}`) : undefined);

          if (matchedMethod) {
            it.paymentMethod = matchedMethod;
          }
        }
      } catch (enrichErr) {
        console.warn('[getPaymentHistory] Could not enrich payment methods:', enrichErr);
      }
    }

    const totalAmount = items.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );

    return {
      items,
      totalCount: items.length,
      totalAmount,
      fromApi: true,
      status: 200,
      error: null,
    };
  } catch (err: unknown) {
    console.error('[getPaymentHistory] Server error in getPaymentHistory:', err);
    let status = 500;
    let errorMessage = 'حدث خطأ أثناء جلب سجل المدفوعات من الخادم.';

    if (err instanceof ApiError) {
      status = err.status;
      if (err.status === 401) {
        errorMessage = 'يرجى تسجيل الدخول لعرض سجل المدفوعات (401).';
      } else if (err.status === 404) {
        errorMessage = 'لا توجد سجلات مدفوعات حالياً (404).';
      } else if (err.status >= 500) {
        errorMessage = 'خطأ في خادم المدفوعات (500). يرجى المحاولة لاحقاً.';
      } else {
        errorMessage = `تعذر جلب سجل المدفوعات (رمز الخطأ: ${err.status}).`;
      }
    }

    return {
      items: [],
      totalCount: 0,
      totalAmount: 0,
      fromApi: false,
      status,
      error: errorMessage,
    };
  }
}
