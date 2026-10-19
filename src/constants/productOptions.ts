/**
 * Centralized Product Category & Unit of Measurement Options for Watheq Platform.
 */

export const PRODUCT_CATEGORIES = [
  'مواد غذائية',
  'مشروبات',
  'ألبان وأجبان',
  'مخبوزات',
  'خضار وفواكه',
  'لحوم ودواجن',
  'منظفات',
  'مستلزمات منزلية',
  'عناية شخصية',
  'قرطاسية',
  'إلكترونيات',
  'أخرى',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number] | string;

export const PRODUCT_UNITS = [
  'حبة',
  'باكو',
  'كرتونة',
  'صندوق',
  'كيلوغرام',
  'غرام',
  'لتر',
  'ملليلتر',
  'عبوة',
  'زجاجة',
  'كيس',
  'علبة',
  'ربطة',
  'متر',
  'طقم',
  'أخرى',
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number] | string;

export const FALLBACK_UNSPECIFIED = 'غير محدد';

/**
 * Format quantity with unit label.
 * Example: formatQuantityWithUnit(12, 'حبة') => '12 حبة'
 * Example: formatQuantityWithUnit(5, 'كيلوغرام') => '5 كيلوغرام'
 * Example: formatQuantityWithUnit(3, undefined) => '3 (غير محدد)'
 */
export function formatQuantityWithUnit(quantity: number, unit?: string | null): string {
  const cleanUnit = unit?.trim();
  if (cleanUnit) {
    return `${quantity} ${cleanUnit}`;
  }
  return `${quantity}`;
}

/**
 * Returns the display category or fallback 'غير محدد' for legacy products.
 */
export function getDisplayCategory(category?: string | null): string {
  const clean = category?.trim();
  return clean || FALLBACK_UNSPECIFIED;
}

/**
 * Returns the display unit or fallback 'غير محدد' for legacy products.
 */
export function getDisplayUnit(unit?: string | null): string {
  const clean = unit?.trim();
  return clean || FALLBACK_UNSPECIFIED;
}
