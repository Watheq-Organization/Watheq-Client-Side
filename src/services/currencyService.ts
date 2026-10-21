import { httpClient } from '../api/httpClient';

export interface CurrencyDto {
  id: number;
  code: string;
  name: string;
}

export const DEFAULT_CURRENCIES: CurrencyDto[] = [
  { id: 1, code: 'ILS', name: 'Israeli Shekel' },
  { id: 2, code: 'USD', name: 'US Dollar' },
  { id: 3, code: 'JOD', name: 'Jordanian Dinar' },
];

/**
 * GET https://whateq.runasp.net/api/Currency/getCurrencies
 * Response Wrapper: CommandResult<IReadOnlyList<CurrencyDto>>
 * Safely unwraps the array from the CommandResult wrapper:
 * res.data?.data || res.data?.value || res.data || bare array
 */
export async function getCurrencies(): Promise<CurrencyDto[]> {
  try {
    const raw = await httpClient.get<unknown>('/Currency/getCurrencies');
    const items = unwrapCurrencyList(raw);
    if (items.length > 0) {
      return items;
    }
    return DEFAULT_CURRENCIES;
  } catch (error) {
    console.warn('[getCurrencies] Could not fetch currencies from server, using default list:', error);
    return DEFAULT_CURRENCIES;
  }
}

function unwrapCurrencyList(response: unknown): CurrencyDto[] {
  if (!response) return [];
  if (Array.isArray(response)) {
    return response.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
  }

  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;

    // Check res.data?.data
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) {
        return inner.data.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
      }
      if (Array.isArray(inner.value)) {
        return inner.value.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
      }
    }

    // Check res.data
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
    }

    // Check res.value
    if (Array.isArray(obj.value)) {
      return obj.value.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
    }

    // Check res.result
    if (Array.isArray(obj.result)) {
      return obj.result.map(normalizeCurrencyDto).filter(Boolean) as CurrencyDto[];
    }
  }

  return [];
}

function normalizeCurrencyDto(item: unknown): CurrencyDto | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  const id = Number(r.id ?? r.Id);
  const code = String(r.code ?? r.Code ?? '').trim().toUpperCase();
  const name = String(r.name ?? r.Name ?? code).trim();

  if (isNaN(id) || !code) return null;
  return { id, code, name };
}
