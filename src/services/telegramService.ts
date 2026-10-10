import { httpClient } from '../api/httpClient';

export interface TelegramLinkResponse {
  link: string;
  isLinked: boolean;
  chatId?: string;
  linkedAt?: string;
}

export interface BankStatementImportResponse {
  success: boolean;
  message: string;
  importedCount?: number;
}

/**
 * POST /api/Telegram/link
 * Links a Telegram account to a customer using the provided token or data.
 */
export async function linkTelegramAccount(payload: { customerId: number; token: string }): Promise<void> {
  await httpClient.post<unknown>('/Telegram/link', payload);
}

/**
 * GET /api/Telegram/link/{customerId}
 * Retrieves the Telegram link status and details for a customer.
 */
export async function getTelegramCustomerLink(customerId: number | string): Promise<TelegramLinkResponse> {
  const response = await httpClient.get<unknown>(`/Telegram/link/${customerId}`);
  const r = (response || {}) as Record<string, unknown>;
  return {
    link: String(r.link ?? r.Link ?? ''),
    isLinked: Boolean(r.isLinked ?? r.IsLinked ?? false),
    chatId: r.chatId ? String(r.chatId) : undefined,
    linkedAt: r.linkedAt ? String(r.linkedAt) : undefined,
  };
}

/**
 * POST /api/bankstatement/import
 * Imports bank statements, often sent via Telegram or uploaded.
 */
export async function importBankStatement(file: File): Promise<BankStatementImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.post<unknown>('/bankstatement/import', formData);
  const r = (response || {}) as Record<string, unknown>;
  
  return {
    success: Boolean(r.success ?? r.Success ?? true),
    message: String(r.message ?? r.Message ?? 'تم الاستيراد بنجاح'),
    importedCount: typeof r.importedCount === 'number' ? r.importedCount : undefined,
  };
}
