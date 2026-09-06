import { httpClient } from '../api/httpClient';
import type { DashboardSummary } from '../types/dashboard';

/**
 * GET http://whateq.runasp.net/api/Dashboard/summary
 * Fetches dashboard statistics and summary metrics.
 */
export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const response = await httpClient.get<any>('/Dashboard/summary');
    if (response && typeof response === 'object') {
      // The ASP.NET API returns: { result: { code: 200, message: "..." }, data: { customersCount: 1, ... } }
      // response.data contains the actual DashboardSummaryDto payload.
      const payload = response.data ?? response.result ?? response;
      if (payload && typeof payload === 'object') {
        return {
          customersCount: Number(payload.customersCount) || 0,
          totalDebt: Number(payload.totalDebt) || 0,
          collectedAmount: Number(payload.collectedAmount) || 0,
          remainingAmount: Number(payload.remainingAmount) || 0,
          overdueAmount: Number(payload.overdueAmount) || 0,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    return null;
  }
}
