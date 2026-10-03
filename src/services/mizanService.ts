import { httpClient } from '../api/httpClient';

export interface ReconciliationSummary {
  totalRecordedSales: number;
  totalBankInflows: number;
  reconciledAmount: number;
  reconciledCount: number;
  uncollectedAmount: number;
  uncollectedCount: number;
  discrepanciesCount?: number;
}

export interface ReconciledSale {
  id: string;
  time: string;
  amount: number;
  customerName: string;
  bankSender: string;
  ref: string;
  status: string;
}

export interface UncollectedSale {
  id: string;
  items: string;
  amount: number;
  customerInfo: string;
  status: string;
}

export interface Discrepancy {
  id: string;
  invoiceAmount: number;
  bankAmount: number;
  customerName: string;
  bankSender: string;
  issue: string;
}

export interface UnmatchedInflow {
  id?: string;
  time: string;
  amount: number;
  bankSender: string;
  ref: string;
  notes: string;
}

export interface ReconciliationTransactions {
  reconciled: ReconciledSale[];
  uncollected: UncollectedSale[];
  discrepancies: Discrepancy[];
  unmatched: UnmatchedInflow[];
}

export async function uploadAndStartReconciliation(formData: FormData): Promise<{ sessionId: string }> {
  // Using POST to start a new reconciliation session
  // If the interceptor adds Content-Type application/json by default, we need to ensure it's multipart/form-data
  // Typically Axios/Fetch removes the content-type header if FormData is passed so the browser can set boundary correctly
  const response = await httpClient.postForm<{ sessionId: string }>('/mizan/reconciliations', formData);
  return response;
}

export async function getReconciliations(): Promise<any> {
  const response = await httpClient.get<any>('/mizan/reconciliations');
  return response;
}

export async function getReconciliationSummary(sessionId: string): Promise<ReconciliationSummary> {
  const response = await httpClient.get<ReconciliationSummary>(`/mizan/reconciliations/${sessionId}/summary`);
  return response;
}

export async function getReconciliationTransactions(sessionId: string, params?: { status?: string; page?: number }): Promise<ReconciliationTransactions> {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await httpClient.get<ReconciliationTransactions>(`/mizan/reconciliations/${sessionId}/transactions${query}`);
  return response;
}

export async function approveMatchedTransaction(transactionId: string): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/transactions/${transactionId}/approve`, {});
  return response;
}

export async function convertSaleToDebt(saleId: string, payload?: { customerId?: string; notes?: string }): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/sales/${saleId}/convert-to-debt`, payload || {});
  return response;
}

export async function createSaleFromDeposit(transactionId: string, payload: { customerName?: string; notes?: string }): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/transactions/${transactionId}/create-sale`, payload);
  return response;
}
