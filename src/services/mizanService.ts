import { httpClient } from '../api/httpClient';

export interface ReconciliationSummary {
  period?: string;
  from?: string;
  to?: string;
  totalBankTransactions?: number;
  matched?: number;
  needsReview?: number;
  unclaimedDeposits?: number;
  missingInBank?: number;
  discrepancies?: number;
  finalApproved?: number;
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

export async function uploadAndStartReconciliation(formData: FormData, period?: string, bankName?: string): Promise<{ sessionId: string }> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (bankName) params.append('bankName', bankName);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await httpClient.postForm<any>(`/mizan/reconciliations${query}`, formData);
  return response.data ? response.data : response;
}

export async function getReconciliations(): Promise<any> {
  const response = await httpClient.get<any>('/mizan/reconciliations');
  return response.data ? response.data : response;
}

export async function getReconciliationSummary(sessionId: string): Promise<ReconciliationSummary> {
  const response = await httpClient.get<any>(`/mizan/reconciliations/${sessionId}/summary`);
  return response.data ? response.data : response;
}

export async function getReconciliationTransactions(sessionId: string, params?: { status?: string; page?: number }): Promise<ReconciliationTransactions> {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  const response = await httpClient.get<any>(`/mizan/reconciliations/${sessionId}/transactions${query}`);
  return response.data ? response.data : response;
}

export async function approveMatchedTransaction(transactionId: string): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/transactions/${transactionId}/approve`, {});
  return response.data ? response.data : response;
}

export async function convertSaleToDebt(saleId: string, payload?: { customerId?: string; notes?: string }): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/sales/${saleId}/convert-to-debt`, payload || {});
  return response.data ? response.data : response;
}

export async function createSaleFromDeposit(transactionId: string, payload: { customerName?: string; notes?: string }): Promise<any> {
  const response = await httpClient.post<any>(`/mizan/transactions/${transactionId}/create-sale`, payload);
  return response.data ? response.data : response;
}
