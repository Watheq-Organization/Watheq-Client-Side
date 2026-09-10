import { httpClient, ApiError } from '../api/httpClient';
import type { CreateDebtPayload, DebtDto, DeleteDebtResponseDto, UpdateDebtPayload } from '../types/debt';
import type { CustomerDto } from '../types/customer';
import { getCustomers } from './customerService';

/**
 * POST http://whateq.runasp.net/api/Debt/createDebt
 *
 * Confirmed directly from the backend's Swagger/OpenAPI listing (Debt
 * section): `POST /api/Debt/createDebt` creates a debt, and
 * `PUT /api/Debt/{id}` updates one. The previous guess, `/Debt/addDebt`,
 * did not exist on the server at all — every request to it came back as
 * an empty 405 Method Not Allowed with no Allow header, which is what a
 * hosting layer returns for a route it doesn't recognize, not what a
 * real controller returns for a wrong HTTP verb on a route it does know.
 */
const CREATE_DEBT_PATH = '/Debt/createDebt';

/**
 * No currency selector exists anywhere in the app (no CurrencyContext, no
 * currency service/dropdown) and the Add New Debt screenshot doesn't show
 * one either — the UI displays "شيكل إسرائيلي" as fixed text. Per
 * the task's instruction to map currencyId under the hood without adding a
 * UI control, this is the single default used until a real currency
 * context is introduced.
 */
export const DEFAULT_CURRENCY_ID = 1;

/** The Arabic fallback business string used when no notes were entered. */
const DEFAULT_DEBT_REASON = 'تسجيل دين جديد';

/**
 * The backend's Create Debt contract marks `reason` as required, but the
 * "Add New Debt" screen (per its reference screenshot) must never render a
 * Reason field. This function is the single, isolated place that resolves
 * that mismatch: it is never called from JSX, only from
 * buildCreateDebtPayload below.
 */
function resolveDebtReason(notes: string | undefined): string {
  return notes?.trim() || DEFAULT_DEBT_REASON;
}

export interface AddDebtFormValues {
  customerId: string;
  amount: string;
  dueDate: string; // yyyy-mm-dd, as produced by <input type="date">
  notes: string;
}

/**
 * Converts an <input type="date"> value ("yyyy-mm-dd") into the ISO
 * datetime string format the API expects (e.g. "2026-10-01T00:00:00").
 */
function toIsoDueDate(dateOnly: string): string {
  return `${dateOnly}T00:00:00`;
}

/**
 * Assembles the exact request body sent to the Create Debt API from the
 * values the visible form actually collects, applying the reason/currency
 * fallbacks documented above. Kept separate from createDebt() so the
 * mapping itself is easy to unit test without a network call.
 */
export function buildCreateDebtPayload(values: AddDebtFormValues): CreateDebtPayload {
  return {
    customerId: Number(values.customerId),
    amount: Number(values.amount),
    currencyId: DEFAULT_CURRENCY_ID,
    reason: resolveDebtReason(values.notes),
    dueDate: toIsoDueDate(values.dueDate),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

export async function createDebt(values: AddDebtFormValues): Promise<DebtDto> {
  const payload = buildCreateDebtPayload(values);
  // Diagnostic only — see the matching note in toCreateDebtErrorMessage
  // below. Logs exactly what's being sent so a rejected request can be
  // compared against the real API contract from the browser console.
  // eslint-disable-next-line no-console
  console.log('[createDebt] POST', CREATE_DEBT_PATH, payload);
  return httpClient.post<DebtDto>(CREATE_DEBT_PATH, payload);
}

/* ---------------------------------------------------------------------- */
/* Update Debt — PUT /api/Debt/{id}                                        */
/* ---------------------------------------------------------------------- */

const updateDebtPath = (id: string | number) => `/Debt/${id}`;

/** Same reason fallback used for create — the single "notes" field the
 * form actually collects doubles as `reason` when nothing more specific
 * was typed, mirroring resolveDebtReason above. */
function resolveUpdateReason(notes: string | undefined): string {
  return notes?.trim() || 'تحديث بيانات الدين';
}

export interface UpdateDebtFormValues extends AddDebtFormValues {
  /** Kept from the debt's current currency unless the caller overrides it. */
  currencyId?: number;
}

export function buildUpdateDebtPayload(values: UpdateDebtFormValues): UpdateDebtPayload {
  return {
    customerId: Number(values.customerId),
    amount: Number(values.amount),
    ...(values.currencyId ? { currencyId: values.currencyId } : {}),
    reason: resolveUpdateReason(values.notes),
    dueDate: toIsoDueDate(values.dueDate),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

export async function updateDebt(
  debtId: string | number,
  values: UpdateDebtFormValues
): Promise<DebtDto> {
  const payload = buildUpdateDebtPayload(values);
  // eslint-disable-next-line no-console
  console.log('[updateDebt] PUT', updateDebtPath(debtId), payload);
  return httpClient.put<DebtDto>(updateDebtPath(debtId), payload);
}

/**
 * Per the documented rule: editing a debt whose current status is
 * "Confirmed" requires a non-empty `notes` explaining the change — the
 * backend rejects the request otherwise. The screen can't know the debt's
 * live status without fetching it, so this is checked client-side against
 * the status captured when the debt was created/last edited (see
 * rememberEditableDebt below) before the request is even sent.
 */
export function validateUpdateNotesForStatus(
  status: string | null | undefined,
  notes: string
): string | null {
  if (status === 'Confirmed' && !notes.trim()) {
    return 'هذا الدين مؤكد — يجب إضافة ملاحظة توضح سبب التعديل.';
  }
  return null;
}

/** Maps updateDebt errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toUpdateDebtErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[updateDebt] backend responded with an error:', {
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
    if (message.includes('Debt not found')) {
      return 'تعذر العثور على هذا الدين. قد يكون قد حُذف أو تم تعديله من مكان آخر.';
    }
    if (message.includes('Customer not found')) {
      return 'تعذر العثور على هذا العميل.';
    }
    if (message.includes('does not exist') && message.toLowerCase().includes('currency')) {
      return 'العملة المحددة غير موجودة.';
    }
    if (message.includes('A note explaining changes to a confirmed debt is required')) {
      return 'هذا الدين مؤكد — يجب إضافة ملاحظة توضح سبب التعديل.';
    }
    if (message.includes('Debt amount must be greater than zero')) {
      return 'يجب أن يكون مبلغ الدين أكبر من صفر.';
    }
    if (message.includes('A valid customer is required')) {
      return 'يجب اختيار عميل صحيح.';
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
    return 'تعذر تحديث الدين. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Delete Debt — DELETE /api/Debt/{id}?confirmDeleteWithPayments=...       */
/*                                                                          */
/* Per the documented contract, a debt with prior payments is NOT deleted  */
/* on the first call: the backend responds 400 with                        */
/* requiresConfirmation=true and the frontend must re-send the same        */
/* request with confirmDeleteWithPayments=true once the merchant confirms  */
/* they also want the associated payments deleted. Query parameter is used */
/* (not the request-body alternative) per the doc's own "Important         */
/* Frontend Note" recommending it for clarity. No UserId is ever sent —    */
/* the backend extracts it from the JWT.                                   */
/* ---------------------------------------------------------------------- */

const deleteDebtPath = (id: string | number, confirmDeleteWithPayments: boolean) =>
  `/Debt/${id}?confirmDeleteWithPayments=${confirmDeleteWithPayments}`;

export async function deleteDebt(
  debtId: string | number,
  confirmDeleteWithPayments = false
): Promise<DeleteDebtResponseDto> {
  return httpClient.delete<DeleteDebtResponseDto>(
    deleteDebtPath(debtId, confirmDeleteWithPayments)
  );
}

/**
 * True only when the backend rejected the delete specifically because the
 * debt has associated payments and a second, explicit confirmation is
 * required (400 + requiresConfirmation=true) — the expected first step of
 * the two-step flow, not a real failure. Callers should check this before
 * falling back to toDeleteDebtErrorMessage.
 */
export function isDeleteDebtRequiresConfirmation(
  error: unknown
): error is ApiError & { body: DeleteDebtResponseDto } {
  if (!(error instanceof ApiError) || error.status !== 400) return false;
  const body = error.body as Partial<DeleteDebtResponseDto> | null;
  return !!body && typeof body === 'object' && body.requiresConfirmation === true;
}

/** Maps deleteDebt errors to user-friendly Arabic messages, incl. known
 * backend business errors. Not meant to be called for the
 * requiresConfirmation case — check isDeleteDebtRequiresConfirmation()
 * first. */
export function toDeleteDebtErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[deleteDebt] backend responded with an error:', {
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
    if (message.includes('Debt not found')) {
      return 'تعذر العثور على هذا الدين. قد يكون قد حُذف بالفعل.';
    }
    if (message.includes('A valid debt is required')) {
      return 'معرّف الدين غير صالح.';
    }
    if (message.includes('not authorized to delete this debt')) {
      return 'لا تملك صلاحية حذف هذا الدين.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية حذف هذا الدين.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على هذا الدين.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حذف الدين. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Local "editable debt" record — bridges a real backend gap.              */
/*                                                                          */
/* GET /api/Customer/getCustomerProfile/{id} (the Financial Activity Log's */
/* data source) returns each transaction's `reference` (the debt number)   */
/* but never the numeric debt `id` that PUT /api/Debt/{id} requires — see  */
/* CustomerProfileTransactionDto in types/customer.ts. There is no lookup  */
/* endpoint to resolve debtNumber -> id either.                            */
/*                                                                          */
/* So the numeric id is captured the one moment the frontend legitimately  */
/* has it — right after createDebt()/updateDebt() succeeds — and cached    */
/* locally keyed by (customerId, debtNumber). The edit icon in the         */
/* Financial Activity Log can then look a debt up by its visible reference */
/* number. Debts created before this feature existed, or on another        */
/* device/browser, simply won't be in this cache — that's a real,          */
/* disclosed limitation until the backend exposes the id directly.         */
/* ---------------------------------------------------------------------- */

export interface EditableDebtRecord {
  id: string;
  debtNumber: string;
  customerId: string;
  amount: number;
  dueDate: string; // yyyy-mm-dd, ready for <input type="date">
  notes: string;
  status: string | null;
  currencyId?: number;
}

function editableDebtStorageKey(customerId: string, debtNumber: string): string {
  return `debt-editable:${customerId}:${debtNumber}`;
}

/** Converts an API ISO datetime ("2026-10-15T00:00:00") back to the
 * yyyy-mm-dd shape <input type="date"> needs. */
function toDateOnly(iso: string | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/**
 * Persists everything needed to re-open the Add Debt screen in edit mode
 * for this debt, using the values just submitted plus whatever the
 * backend echoed back (id/debtNumber/status). Called after both create
 * and update succeed, so the cache always reflects the debt's latest
 * known state.
 */
export function rememberEditableDebt(
  customerId: string,
  values: AddDebtFormValues,
  dto: DebtDto
): void {
  const debtNumber = typeof dto.debtNumber === 'string' ? dto.debtNumber : '';
  const id = dto.id != null ? String(dto.id) : '';
  if (!debtNumber || !id) return; // nothing usable to cache
  try {
    const record: EditableDebtRecord = {
      id,
      debtNumber,
      customerId,
      amount: Number(values.amount) || 0,
      dueDate: values.dueDate,
      notes: values.notes.trim(),
      status: typeof dto.status === 'string' ? dto.status : null,
      ...(typeof dto.currencyId === 'number' ? { currencyId: dto.currencyId } : {}),
    };
    localStorage.setItem(editableDebtStorageKey(customerId, debtNumber), JSON.stringify(record));
  } catch {
    // Ignore storage failures (e.g. private browsing) — editing this debt
    // later will just fall back to the "not available" message.
  }
}

/** Looks up a previously cached debt by the reference number shown in the
 * Financial Activity Log. Returns null if this debt was never created or
 * edited in this browser (see the module comment above). */
export function getEditableDebt(customerId: string, debtNumber: string): EditableDebtRecord | null {
  if (!customerId || !debtNumber) return null;
  try {
    const raw = localStorage.getItem(editableDebtStorageKey(customerId, debtNumber));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EditableDebtRecord;
    return { ...parsed, dueDate: toDateOnly(parsed.dueDate) || parsed.dueDate };
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/* Frontend validation — mirrors the style of validateCustomerFullName /   */
/* validatePaymentAmount elsewhere in the codebase.                        */
/* ---------------------------------------------------------------------- */

export function validateSelectedCustomer(customerId: string): string | null {
  const numeric = Number(customerId);
  if (!customerId || !Number.isFinite(numeric) || numeric <= 0) {
    return 'يجب اختيار عميل صحيح.';
  }
  return null;
}

export function validateDebtAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'يجب أن يكون مبلغ الدين أكبر من صفر.';
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'يجب أن يكون مبلغ الدين أكبر من صفر.';
  }
  return null;
}

export function validateDebtDueDate(value: string): string | null {
  if (!value.trim()) return 'تاريخ الاستحقاق مطلوب.';
  return null;
}

const MAX_NOTES_LENGTH = 2000;

export function validateDebtNotes(value: string): string | null {
  if (value.length > MAX_NOTES_LENGTH) {
    return 'لا يمكن أن تتجاوز الملاحظات 2000 حرف.';
  }
  return null;
}

/* ---------------------------------------------------------------------- */
/* Customer search — no dedicated "search customer" endpoint exists in    */
/* this project, so per the task instructions this filters the existing   */
/* getCustomers() list client-side by id or phone number rather than      */
/* inventing a new backend route.                                         */
/* ---------------------------------------------------------------------- */

export async function searchCustomersByIdOrPhone(query: string): Promise<CustomerDto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const all = await getCustomers();
  return all.filter(
    (customer) => customer.id.includes(trimmed) || customer.phoneNumber.includes(trimmed)
  );
}

/** Maps createDebt errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toCreateDebtErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Diagnostic only — logs the real status/body the backend sent so this
    // can be debugged from the browser console. Every branch below maps to
    // an Arabic message the merchant sees, but none of them expose the raw
    // status/body, so without this the *real* cause of "تعذر تسجيل الدين"
    // (an unhandled status/shape — see the fallback at the bottom of this
    // function) is invisible. Does not change any user-facing behavior.
    // eslint-disable-next-line no-console
    console.error('[createDebt] backend responded with an error:', {
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
    if (message.toLowerCase().includes('currency')) {
      return 'تعذر تحديد العملة المستخدمة. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.';
    }
    if (message.includes('Could not generate a unique debt number')) {
      return 'تعذر توليد رقم دين فريد. يرجى المحاولة مرة أخرى.';
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
    return 'تعذر تسجيل الدين. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}
