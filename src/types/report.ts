/**
 * Types for Reports API:
 * - GET /api/Reports/collections
 * - GET /api/Reports/overdue-debts
 * - GET /api/Reports/customer-performance
 */

export interface CollectionsReportParams {
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CollectionItem {
  id: string | number;
  paymentId?: number;
  customerId?: string | number;
  customerName: string;
  amount: number;
  currency?: string;
  date: string;
  paymentMethod?: string;
  receiptNumber?: string;
  status?: string;
}

export interface CollectionsChartPoint {
  label: string;
  amount: number;
  currency?: string;
}

export interface CollectionsSummaryItem {
  currency: string;
  totalCollected: number;
  numberOfPayments: number;
  averagePayment: number;
}

export interface CollectionsReportResponse {
  hasData?: boolean;
  message?: string | null;
  totalCollected: number;
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  summary?: CollectionsSummaryItem[];
  chart?: CollectionsChartPoint[];
  items: CollectionItem[];
}

export interface OverdueDebtsReportParams {
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface OverdueDebtSummaryItem {
  currencyCode: string;
  totalOverdueAmount: number;
  numberOfOverdueDebts: number;
  numberOfCustomersWithOverdueDebts: number;
}

export interface OverdueDebtChartPoint {
  label: string;
  amount: number;
  currencyCode: string;
}

export interface OverdueDebtReportItem {
  debtId: number;
  customerId: number | string;
  customerName: string;
  originalAmount: number;
  remainingAmount: number;
  currencyCode: string;
  dueDate: string;
  daysOverdue: number;
  status: string;
}

export interface OverdueDebtsReportDetails {
  items: OverdueDebtReportItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface OverdueDebtsReportResponse {
  hasData: boolean;
  message?: string | null;
  summary: OverdueDebtSummaryItem[];
  chart: OverdueDebtChartPoint[];
  details: OverdueDebtsReportDetails | null;
}

export interface CustomerPerformanceParams {
  fromDate?: string;
  toDate?: string;
}

export interface CustomerPerformanceItem {
  customerId: string | number;
  customerName: string;
  totalDebts: number;
  totalPaid: number;
  commitmentRate: number;
  lastPaymentDate?: string;
}

export interface CustomerPerformanceReportResponse {
  totalCustomers: number;
  items: CustomerPerformanceItem[];
}
