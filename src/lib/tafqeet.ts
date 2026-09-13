/**
 * Arabic number to words conversion (Tafqeet) for financial receipts.
 */

const ONES = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const TENS = [
  '',
  '',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
];

const HUNDREDS = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function convertThreeDigits(n: number): string {
  if (n === 0) return '';

  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const o = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (o > 0) {
        parts.push(`${ONES[o]} و${TENS[t]}`);
      } else {
        parts.push(TENS[t]);
      }
    }
  }

  return parts.join(' و');
}

export function tafqeet(amount: number, currency: string = 'ريال سعودي'): string {
  if (amount === 0) return `صفر ${currency}`;

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const millions = Math.floor(integerPart / 1000000);
  const units = integerPart % 1000;

  const parts: string[] = [];

  // Millions
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(`${convertThreeDigits(millions)} ملايين`);
    else parts.push(`${convertThreeDigits(millions)} مليون`);
  }

  // Thousands
  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertThreeDigits(thousands)} آلاف`);
    else parts.push(`${convertThreeDigits(thousands)} ألف`);
  }

  // Units
  if (units > 0) {
    parts.push(convertThreeDigits(units));
  }

  let words = parts.join(' و');
  if (currency) {
    words = `${words} ${currency}`;
  }

  if (decimalPart > 0) {
    words = `${words} و${convertThreeDigits(decimalPart)} هللة`;
  }

  return words;
}
