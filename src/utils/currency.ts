/**
 * Central Currency Utility for Platform "Watheq"
 * Standardizes Multi-Currency support aligned directly with Backend (/api/Currency/getCurrencies):
 * - ILS (id: 4, ₪ شيكل إسرائيلي) - Default
 * - USD (id: 1, $ دولار أمريكي)
 * - EUR (id: 2, € يورو أوروبي)
 * - GBP (id: 3, £ جنيه إسترليني)
 */

export type CurrencyCode = 'ILS' | 'USD' | 'EUR' | 'GBP' | 'JOD';

export interface CurrencyConfig {
  id: number;
  code: CurrencyCode;
  symbol: string;
  labelAr: string;
  labelArFull: string;
  labelEn: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  ILS: {
    id: 4,
    code: 'ILS',
    symbol: '₪',
    labelAr: 'شيكل',
    labelArFull: 'شيكل إسرائيلي',
    labelEn: 'ILS',
  },
  USD: {
    id: 1,
    code: 'USD',
    symbol: '$',
    labelAr: 'دولار',
    labelArFull: 'دولار أمريكي',
    labelEn: 'USD',
  },
  EUR: {
    id: 2,
    code: 'EUR',
    symbol: '€',
    labelAr: 'يورو',
    labelArFull: 'يورو أوروبي',
    labelEn: 'EUR',
  },
  GBP: {
    id: 3,
    code: 'GBP',
    symbol: '£',
    labelAr: 'جنيه',
    labelArFull: 'جنيه إسترليني',
    labelEn: 'GBP',
  },
  JOD: {
    id: 5,
    code: 'JOD',
    symbol: 'د.أ',
    labelAr: 'دينار',
    labelArFull: 'دينار أردني',
    labelEn: 'JOD',
  },
};

export const DEFAULT_CURRENCY: CurrencyConfig = SUPPORTED_CURRENCIES.ILS;

export const ALL_CURRENCY_CODES: CurrencyCode[] = ['ILS', 'USD', 'EUR', 'GBP'];

export const CURRENCY_LIST: CurrencyConfig[] = [
  SUPPORTED_CURRENCIES.ILS,
  SUPPORTED_CURRENCIES.USD,
  SUPPORTED_CURRENCIES.EUR,
  SUPPORTED_CURRENCIES.GBP,
];

/**
 * Normalizes any currency representation (string, numeric ID, or symbol) into a valid CurrencyCode.
 * Uses exact backend IDs: 4 -> ILS, 1 -> USD, 2 -> EUR, 3 -> GBP.
 * Always falls back safely to 'ILS' if not recognized.
 */
export function normalizeCurrencyCode(val: unknown): CurrencyCode {
  if (val === undefined || val === null || val === '') {
    return 'ILS';
  }

  // Exact backend numeric IDs
  if (typeof val === 'number') {
    if (val === 4) return 'ILS';
    if (val === 1) return 'USD';
    if (val === 2) return 'EUR';
    if (val === 3) return 'GBP';
    if (val === 5) return 'JOD';
  }

  const s = String(val).trim().toUpperCase();

  // Exact code match
  if (s === 'ILS' || s === 'USD' || s === 'EUR' || s === 'GBP' || s === 'JOD') {
    return s as CurrencyCode;
  }

  // By numeric string
  if (s === '4') return 'ILS';
  if (s === '1') return 'USD';
  if (s === '2') return 'EUR';
  if (s === '3') return 'GBP';
  if (s === '5') return 'JOD';

  // Symbols
  if (s === '₪') return 'ILS';
  if (s === '$') return 'USD';
  if (s === '€') return 'EUR';
  if (s === '£') return 'GBP';
  if (s === 'د.أ' || s === 'JD') return 'JOD';

  // Arabic words / common aliases
  if (s.includes('شيكل') || s.includes('SHEKEL') || s.includes('NIS')) {
    return 'ILS';
  }
  if (s.includes('دولار') || s.includes('DOLLAR')) {
    return 'USD';
  }
  if (s.includes('يورو') || s.includes('EURO') || s.includes('EUR')) {
    return 'EUR';
  }
  if (s.includes('جنيه') || s.includes('POUND') || s.includes('GBP') || s.includes('استرليني') || s.includes('إسترليني')) {
    return 'GBP';
  }
  if (s.includes('دينار') || s.includes('DINAR')) {
    return 'JOD';
  }

  return 'ILS';
}

/**
 * Returns the CurrencyConfig for a given currency code, numeric ID, or symbol.
 */
export function getCurrencyConfig(val: unknown): CurrencyConfig {
  const code = normalizeCurrencyCode(val);
  return SUPPORTED_CURRENCIES[code] || DEFAULT_CURRENCY;
}

/**
 * Gets backend numeric currency ID from currency code (1 = ILS, 2 = USD, 3 = JOD).
 */
export function getCurrencyId(val: unknown): number {
  return getCurrencyConfig(val).id;
}

export interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
  showCode?: boolean;
  showLabelAr?: boolean;
}

/**
 * Formats a financial amount with its currency symbol/code.
 * Example outputs:
 * - formatCurrency(150, 'ILS') -> "150 ₪"
 * - formatCurrency(50.5, 'USD') -> "50.50 $"
 * - formatCurrency(20, 'JOD') -> "20 د.أ"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode?: unknown,
  options: FormatCurrencyOptions = {}
): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  const config = getCurrencyConfig(currencyCode);

  const minDigits = options.minimumFractionDigits ?? (num % 1 !== 0 ? 2 : 0);
  const maxDigits = options.maximumFractionDigits ?? 2;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  if (options.showCode) {
    return `${formattedNum} ${config.code}`;
  }
  if (options.showLabelAr) {
    return `${formattedNum} ${config.labelAr}`;
  }

  // Default: display with symbol (e.g. 150 ₪, 50 $, 20 د.أ)
  return `${formattedNum} ${config.symbol}`;
}

/**
 * Represents grouped totals for a single currency.
 */
export interface CurrencyGroupSummary {
  currency: CurrencyConfig;
  totalDebts: number;
  totalPayments: number;
  balance: number;
  debtCount: number;
  paymentCount: number;
  totalCount: number;
  total: number;
  count: number;
}

/**
 * Financial rule: Never sum different currencies together!
 * Groups an array of transaction / debt / payment records by currency code ('ILS', 'USD', 'JOD').
 */
export function groupTotalsByCurrency(
  records: Array<{
    amount?: number | string;
    type?: string;
    currency?: unknown;
    currencyCode?: unknown;
    currencyId?: unknown;
    status?: string | null;
  }>
): Record<CurrencyCode, CurrencyGroupSummary> {
  const summary: Record<CurrencyCode, CurrencyGroupSummary> = {
    ILS: {
      currency: SUPPORTED_CURRENCIES.ILS,
      totalDebts: 0,
      totalPayments: 0,
      balance: 0,
      debtCount: 0,
      paymentCount: 0,
      totalCount: 0,
      total: 0,
      count: 0,
    },
    USD: {
      currency: SUPPORTED_CURRENCIES.USD,
      totalDebts: 0,
      totalPayments: 0,
      balance: 0,
      debtCount: 0,
      paymentCount: 0,
      totalCount: 0,
      total: 0,
      count: 0,
    },
    EUR: {
      currency: SUPPORTED_CURRENCIES.EUR,
      totalDebts: 0,
      totalPayments: 0,
      balance: 0,
      debtCount: 0,
      paymentCount: 0,
      totalCount: 0,
      total: 0,
      count: 0,
    },
    GBP: {
      currency: SUPPORTED_CURRENCIES.GBP,
      totalDebts: 0,
      totalPayments: 0,
      balance: 0,
      debtCount: 0,
      paymentCount: 0,
      totalCount: 0,
      total: 0,
      count: 0,
    },
    JOD: {
      currency: SUPPORTED_CURRENCIES.JOD,
      totalDebts: 0,
      totalPayments: 0,
      balance: 0,
      debtCount: 0,
      paymentCount: 0,
      totalCount: 0,
      total: 0,
      count: 0,
    },
  };

  for (const record of records) {
    const rawCurrency = record.currencyCode ?? record.currency ?? record.currencyId;
    const code = normalizeCurrencyCode(rawCurrency);
    const amount = typeof record.amount === 'number' ? record.amount : Number(record.amount) || 0;
    if (isNaN(amount)) continue;

    const typeStr = String(record.type || '').toLowerCase();
    const isPayment =
      typeStr.includes('payment') ||
      typeStr.includes('pay') ||
      typeStr.includes('دفعة') ||
      typeStr.includes('سداد');

    const bucket = summary[code];
    if (!bucket) continue;
    bucket.totalCount += 1;
    bucket.count += 1;
    bucket.total += amount;

    if (isPayment) {
      bucket.totalPayments += amount;
      bucket.paymentCount += 1;
    } else {
      // Treat as debt
      bucket.totalDebts += amount;
      bucket.debtCount += 1;
    }
  }

  // Calculate net balances per currency
  for (const code of (['ILS', 'USD', 'EUR', 'GBP', 'JOD'] as CurrencyCode[])) {
    summary[code].balance = summary[code].totalDebts - summary[code].totalPayments;
  }

  return summary;
}

/**
 * Returns only the currencies that have active transactions or non-zero balance.
 */
export function getActiveCurrencySummaries(
  summary: Record<CurrencyCode, CurrencyGroupSummary>
): CurrencyGroupSummary[] {
  return (['ILS', 'USD', 'EUR', 'GBP', 'JOD'] as CurrencyCode[])
    .map((code) => summary[code])
    .filter((s) => s && (s.totalCount > 0 || Math.abs(s.balance) > 0.009));
}

/**
 * Currency badge styles for sleek UI display
 */
export const CURRENCY_BADGE_STYLES: Record<CurrencyCode, { bg: string; text: string; border: string }> = {
  ILS: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-800/60',
  },
  USD: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-800/60',
  },
  EUR: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/60 dark:border-amber-800/60',
  },
  GBP: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200/60 dark:border-indigo-800/60',
  },
  JOD: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/60 dark:border-purple-800/60',
  },
};
