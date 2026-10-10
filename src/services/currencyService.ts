import { httpClient } from '../api/httpClient';

export interface CurrencyDto {
  id: number;
  name: string;
  code: string;
  symbol: string;
}

/**
 * GET /api/Currency/getCurrencies
 * Retrieves the list of available currencies from the backend.
 */
export async function getCurrencies(): Promise<CurrencyDto[]> {
  try {
    const response = await httpClient.get<unknown>('/Currency/getCurrencies');
    let items: unknown[] = [];
    if (Array.isArray(response)) {
      items = response;
    } else if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        items = obj.data;
      } else if (Array.isArray(obj.items)) {
        items = obj.items;
      } else if (Array.isArray(obj.result)) {
        items = obj.result;
      }
    }
    
    return items.map((item) => {
      const it = (item || {}) as Record<string, unknown>;
      return {
        id: Number(it.id) || 1,
        name: String(it.name ?? it.Name ?? ''),
        code: String(it.code ?? it.Code ?? ''),
        symbol: String(it.symbol ?? it.Symbol ?? ''),
      };
    });
  } catch (error) {
    console.error('[getCurrencies] Failed to fetch currencies:', error);
    return [];
  }
}
