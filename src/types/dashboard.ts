export interface DashboardSummary {
  totalOutstandingDebt?: number;
  totalDebts?: number;
  outstandingDebts?: number;
  totalCustomers?: number;
  activeCustomers?: number;
  totalCollections?: number;
  collectedAmount?: number;
  debtPercentageChange?: number;
  customerPercentageChange?: number;
  [key: string]: unknown;
}

export interface DashboardSummaryResult {
  success: boolean;
  data?: DashboardSummary;
  message?: string;
}
