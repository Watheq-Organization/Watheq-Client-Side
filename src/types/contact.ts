/**
 * Shape of the Contact Us form as controlled by the UI (ContactPage).
 *
 * No existing type/interface for a contact form was found anywhere in
 * the project (checked src/types, src/services, src/components), so
 * this follows the same pattern already used for the Register/Login
 * forms in src/types/auth.ts.
 */
export interface ContactFormData {
  fullName: string;
  email: string;
  inquiryType: string;
  message: string;
}

/**
 * Inquiry type options for the Contact Us form's Select field.
 *
 * No existing inquiry-type enum, constant list, or similar values were
 * found anywhere in the project (checked src/types, src/services,
 * src/components), so this list is newly defined here — in one place —
 * for the Select field to consume.
 */
export const INQUIRY_TYPES = [
  { value: 'technical', label: 'استفسار تقني' },
  { value: 'billing', label: 'الفواتير والدفع' },
  { value: 'general', label: 'استفسار عام' },
  { value: 'suggestion', label: 'اقتراح' },
  { value: 'complaint', label: 'شكوى' },
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]['value'];

/** Result shape returned by contactService, mirrors AuthResult in types/auth.ts. */
export interface ContactResult {
  success: boolean;
  message: string;
}
