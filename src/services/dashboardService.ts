import { httpClient } from '../api/httpClient';
import type { DashboardSummary } from '../types/dashboard';

/**
 * GET http://whateq.runasp.net/api/Dashboard/summary
 * Fetches dashboard statistics and summary metrics.
 */
export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const response = await httpClient.get<any>('/Dashboard/summary');
    // In case the API wraps the payload in response.data or response.result
    if (response && typeof response === 'object') {
      if (response.result && typeof response.result === 'object') {
        return response.result as DashboardSummary;
      }
      if (response.data && typeof response.data === 'object') {
        return response.data as DashboardSummary;
      }
      return response as DashboardSummary;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    return null;
  }
}
