/**
 * Confirmed contract for GET /api/Dashboard/summary (DashboardSummaryDto),
 * per the official API documentation:
 *   customersCount   - number of customers belonging to the current merchant
 *   totalDebt        - total value of all debts
 *   collectedAmount  - total amount collected so far
 *   remainingAmount  - total amount still outstanding
 *   overdueAmount    - total amount that is overdue
 */
export interface DashboardSummary {
  customersCount: number;
  totalDebt: number;
  collectedAmount: number;
  remainingAmount: number;
  overdueAmount: number;
}

export interface DashboardSummaryResult {
  success: boolean;
  data?: DashboardSummary;
  message?: string;
}

export interface OverduePaymentItem {
  id: string;
  customerName: string;
  amount: string;
  dueDate: string;
  phone?: string;
}

export interface RecentActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  dotColor: string;
  timestamp: number;
}

