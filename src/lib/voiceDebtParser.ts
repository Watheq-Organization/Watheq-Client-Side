/**
 * voiceDebtParser.ts
 *
 * Standalone, testable utilities for parsing an Arabic voice transcript into
 * structured debt fields: amount, dueDate, and notes.
 *
 * Uses JavaScript + Regex only — no APIs, no AI, no external libraries.
 */

// ---------------------------------------------------------------------------
// 1. Arabic Text Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes Arabic text for pattern matching.
 * - Converts Arabic-Indic digits (٠-٩) to ASCII (0-9)
 * - Converts Arabic decimal separator (٫) to dot (.)
 * - Normalizes alef variants (أ إ آ) to bare alef (ا)
 * - Collapses excessive whitespace
 * - Strips tatweel (ـ)
 *
 * NOTE: The original text is used for notes output so the user's natural
 * wording is preserved; this normalized form is only for matching.
 */
export function normalizeArabicText(text: string): string {
  let t = text;

  // Arabic-Indic digits → ASCII
  t = t.replace(/[٠-٩]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x0660 + 48));

  // Extended Arabic-Indic digits (used in some locales)
  t = t.replace(/[۰-۹]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x06f0 + 48));

  // Arabic decimal separator
  t = t.replace(/٫/g, '.');

  // Alef normalization
  t = t.replace(/[أإآ]/g, 'ا');

  // Strip tatweel
  t = t.replace(/ـ/g, '');

  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

// ---------------------------------------------------------------------------
// 2. Amount Parsing
// ---------------------------------------------------------------------------

/** Number pattern that matches integers and decimals (ASCII digits after normalization). */
const NUM = '(\\d+(?:\\.\\d+)?)';

/**
 * Keywords/phrases that introduce an amount. Order matters — longer phrases first.
 * These are used to anchor the number extraction so we don't accidentally grab
 * a date number like "30" from "بتاريخ 30/9".
 */
const AMOUNT_KEYWORDS = [
  'بقيمة',
  'بمبلغ',
  'عليه مبلغ',
  'عليه',
  'المبلغ',
  'مبلغ',
  'قيمة',
  'سجل دين',
  'سجل عليه',
  'دين',
];

/** Currency words that may follow the number (used to confirm but not required). */
const CURRENCY_WORDS =
  '(?:\\s*(?:شيكل|شاقل|شواكل|شيقل|شيقيل|دينار|دولار|ريال|جنيه|ليرة|\\$|USD|ILS|JOD))?';

/**
 * Date-context patterns: numbers that appear to be part of a date expression
 * should NOT be grabbed as amounts.
 */
const DATE_CONTEXT_BEFORE = /(?:بتاريخ|تاريخ|يوم|في)\s+$/;
const DATE_CONTEXT_AFTER = /^\s*[\/\-.]\s*\d/;

/**
 * Extracts the monetary amount from the transcript.
 *
 * Strategy:
 * 1. Try keyword-anchored patterns first (most reliable).
 * 2. Fall back to number + currency word.
 * 3. Last resort: standalone number NOT in date context.
 */
export function parseAmount(text: string): number | null {
  const norm = normalizeArabicText(text);

  // Strategy 1 — keyword-anchored: "بقيمة 500", "مبلغ 750", etc.
  for (const kw of AMOUNT_KEYWORDS) {
    const re = new RegExp(kw + '\\s+' + NUM + CURRENCY_WORDS, 'i');
    const m = norm.match(re);
    if (m?.[1]) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  // Strategy 2 — number followed by currency word: "500 شيكل"
  {
    const re = new RegExp(
      NUM +
        '\\s+(?:شيكل|شاقل|شواكل|شيقل|شيقيل|دينار|دولار|ريال|جنيه|ليرة|\\$|USD|ILS|JOD)',
      'i',
    );
    // Find all occurrences and filter out those in date context
    const matches = [...norm.matchAll(new RegExp(re.source, 'gi'))];
    for (const m of matches) {
      if (m.index !== undefined) {
        const before = norm.slice(0, m.index);
        if (DATE_CONTEXT_BEFORE.test(before)) continue;
        const val = parseFloat(m[1]);
        if (!isNaN(val) && val > 0) return val;
      }
    }
  }

  // Strategy 3 — standalone number not in date context
  {
    const allNums = [...norm.matchAll(/(\d+(?:\.\d+)?)/g)];
    for (const m of allNums) {
      if (m.index === undefined) continue;
      const before = norm.slice(0, m.index);
      const after = norm.slice(m.index + m[0].length);

      // Skip if looks like date context
      if (DATE_CONTEXT_BEFORE.test(before)) continue;
      if (DATE_CONTEXT_AFTER.test(after)) continue;
      // Skip if it's a small number that is part of a date pattern (e.g. DD/MM)
      if (/\//.test(after.slice(0, 3)) || /\//.test(before.slice(-3))) continue;
      // Skip if preceded by a slash (e.g. the month in "30/9")
      if (/[\/\-.]$/.test(before.trimEnd())) continue;

      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 3. Due Date Parsing
// ---------------------------------------------------------------------------

/**
 * Arabic month names → 1-indexed month number.
 * Includes both standard Arabic and Palestinian/Levantine variants.
 */
const ARABIC_MONTHS: Record<string, number> = {
  'يناير': 1, 'كانون الثاني': 1,
  'فبراير': 2, 'شباط': 2,
  'مارس': 3, 'اذار': 3,
  'ابريل': 4, 'نيسان': 4,
  'مايو': 5, 'ايار': 5,
  'يونيو': 6, 'حزيران': 6,
  'يوليو': 7, 'تموز': 7,
  'اغسطس': 8, 'اب': 8,
  'سبتمبر': 9, 'ايلول': 9,
  'اكتوبر': 10, 'تشرين الاول': 10,
  'نوفمبر': 11, 'تشرين الثاني': 11,
  'ديسمبر': 12, 'كانون الاول': 12,
};

/** Weekday names → JS Date.getDay() values (0=Sun … 6=Sat). */
const WEEKDAYS: Record<string, number> = {
  'الاحد': 0, 'حد': 0, 'احد': 0,
  'الاثنين': 0 + 1, 'اثنين': 1,
  'الثلاثاء': 2, 'ثلاثاء': 2,
  'الاربعاء': 3, 'اربعاء': 3,
  'الخميس': 4, 'خميس': 4,
  'الجمعة': 5, 'جمعة': 5,
  'السبت': 6, 'سبت': 6,
};

/** Arabic number words → numeric value (for "بعد ثلاثة أيام" etc.). */
const ARABIC_NUMBER_WORDS: Record<string, number> = {
  'واحد': 1,
  'اثنين': 2, 'اثنان': 2,
  'ثلاثة': 3, 'ثلاث': 3,
  'اربعة': 4, 'اربع': 4,
  'خمسة': 5, 'خمس': 5,
  'ستة': 6, 'ست': 6,
  'سبعة': 7, 'سبع': 7,
  'ثمانية': 8, 'ثماني': 8, 'ثمان': 8,
  'تسعة': 9, 'تسع': 9,
  'عشرة': 10, 'عشر': 10,
};

/** Formats a Date into YYYY-MM-DD. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns the last day of the given month (1-indexed). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Parses the due date from the transcript.
 *
 * Supports:
 * - Explicit numeric dates: 30/9, 30-09-2026, 30.9, etc.
 * - Arabic month names: "30 سبتمبر", "5 أكتوبر 2026"
 * - Relative expressions: اليوم, بكرا, بعد بكرا
 * - Relative periods: بعد يوم, بعد أسبوع, بعد شهر, بعد 3 أيام
 * - Weekday names: الخميس الجاي, يوم الجمعة القادمة
 * - Month boundaries: آخر الشهر, بداية الشهر القادم
 */
export function parseDueDate(text: string): string | null {
  const norm = normalizeArabicText(text);
  const today = new Date();

  // --- Month-end / Month-beginning ---
  if (/(?:اخر|نهاية|بنهاية)\s+(?:هذا\s+)?الشهر/.test(norm)) {
    const last = lastDayOfMonth(today.getFullYear(), today.getMonth() + 1);
    return toDateString(new Date(today.getFullYear(), today.getMonth(), last));
  }
  if (/(?:بداية|اول)\s+الشهر\s+(?:القادم|الجاي)/.test(norm)) {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return toDateString(d);
  }
  if (/(?:بداية|اول)\s+الشهر/.test(norm)) {
    // "بداية الشهر" without "القادم" → 1st of current month (if already past, likely means next)
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    if (first < today) {
      return toDateString(new Date(today.getFullYear(), today.getMonth() + 1, 1));
    }
    return toDateString(first);
  }

  // --- Relative expressions ---
  if (/(?:^|\s)(?:اليوم|هاليوم)(?:\s|$)/.test(norm)) {
    return toDateString(today);
  }
  // "بعد بكرا / بعد بكرة / بعد غد / بعد الغد" — must be checked BEFORE "بكرا" to avoid partial match
  if (/بعد\s+(?:بكرا|بكرة|غد|الغد)/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return toDateString(d);
  }
  if (/(?:بكرا|بكرة|غدا|غدا\u064b)(?:\s|$)/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toDateString(d);
  }

  // --- Relative periods: بعد N يوم/أيام/أسبوع/شهر ---
  {
    // "بعد يومين" (dual)
    if (/بعد\s+يومين/.test(norm)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      return toDateString(d);
    }
    // "بعد أسبوعين" (dual)
    if (/بعد\s+اسبوعين/.test(norm)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 14);
      return toDateString(d);
    }
    // "بعد شهرين" (dual)
    if (/بعد\s+شهرين/.test(norm)) {
      const d = new Date(today);
      d.setMonth(d.getMonth() + 2);
      return toDateString(d);
    }
    // "بعد يوم" (singular, exactly one day)
    if (/بعد\s+يوم(?:\s|$)/.test(norm)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return toDateString(d);
    }
    // "بعد أسبوع" (singular)
    if (/بعد\s+اسبوع(?:\s|$)/.test(norm)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      return toDateString(d);
    }
    // "بعد شهر" (singular)
    if (/بعد\s+شهر(?:\s|$)/.test(norm)) {
      const d = new Date(today);
      d.setMonth(d.getMonth() + 1);
      return toDateString(d);
    }

    // "بعد N أيام/يوم" with digit
    const daysDigitMatch = norm.match(/بعد\s+(\d+)\s*(?:يوم|ايام|أيام)/);
    if (daysDigitMatch?.[1]) {
      const n = parseInt(daysDigitMatch[1], 10);
      if (n > 0) {
        const d = new Date(today);
        d.setDate(d.getDate() + n);
        return toDateString(d);
      }
    }
    // "بعد N أسابيع/أسبوع" with digit
    const weeksDigitMatch = norm.match(/بعد\s+(\d+)\s*(?:اسبوع|اسابيع)/);
    if (weeksDigitMatch?.[1]) {
      const n = parseInt(weeksDigitMatch[1], 10);
      if (n > 0) {
        const d = new Date(today);
        d.setDate(d.getDate() + n * 7);
        return toDateString(d);
      }
    }
    // "بعد N شهور/أشهر/شهر" with digit
    const monthsDigitMatch = norm.match(/بعد\s+(\d+)\s*(?:شهر|شهور|اشهر)/);
    if (monthsDigitMatch?.[1]) {
      const n = parseInt(monthsDigitMatch[1], 10);
      if (n > 0) {
        const d = new Date(today);
        d.setMonth(d.getMonth() + n);
        return toDateString(d);
      }
    }

    // "بعد WORD أيام/يوم" with Arabic number word
    const numberWordKeys = Object.keys(ARABIC_NUMBER_WORDS).join('|');
    const daysWordRe = new RegExp('بعد\\s+(' + numberWordKeys + ')\\s*(?:يوم|ايام|أيام)');
    const daysWordMatch = norm.match(daysWordRe);
    if (daysWordMatch?.[1] && ARABIC_NUMBER_WORDS[daysWordMatch[1]] !== undefined) {
      const n = ARABIC_NUMBER_WORDS[daysWordMatch[1]];
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return toDateString(d);
    }
    const weeksWordRe = new RegExp('بعد\\s+(' + numberWordKeys + ')\\s*(?:اسبوع|اسابيع)');
    const weeksWordMatch = norm.match(weeksWordRe);
    if (weeksWordMatch?.[1] && ARABIC_NUMBER_WORDS[weeksWordMatch[1]] !== undefined) {
      const n = ARABIC_NUMBER_WORDS[weeksWordMatch[1]];
      const d = new Date(today);
      d.setDate(d.getDate() + n * 7);
      return toDateString(d);
    }
    const monthsWordRe = new RegExp('بعد\\s+(' + numberWordKeys + ')\\s*(?:شهر|شهور|اشهر)');
    const monthsWordMatch = norm.match(monthsWordRe);
    if (monthsWordMatch?.[1] && ARABIC_NUMBER_WORDS[monthsWordMatch[1]] !== undefined) {
      const n = ARABIC_NUMBER_WORDS[monthsWordMatch[1]];
      const d = new Date(today);
      d.setMonth(d.getMonth() + n);
      return toDateString(d);
    }
  }

  // --- Weekday names ---
  {
    const weekdayKeys = Object.keys(WEEKDAYS).sort((a, b) => b.length - a.length);
    const weekdayPattern = weekdayKeys.join('|');
    // Match "يوم الخميس الجاي", "الجمعة القادمة", "الأحد", etc.
    const wdRe = new RegExp('(?:يوم\\s+)?(' + weekdayPattern + ')(?:\\s+(?:الجاي|الجاية|القادم|القادمة))?');
    const wdMatch = norm.match(wdRe);
    if (wdMatch?.[1] && WEEKDAYS[wdMatch[1]] !== undefined) {
      const targetDay = WEEKDAYS[wdMatch[1]];
      const currentDay = today.getDay();
      let daysAhead = targetDay - currentDay;
      // If "الجاي/القادم" is present, or if daysAhead <= 0, go to next week
      const hasNext = /الجاي|الجاية|القادم|القادمة/.test(wdMatch[0]);
      if (daysAhead <= 0 || hasNext) {
        if (daysAhead <= 0) daysAhead += 7;
        if (hasNext && daysAhead < 7) daysAhead += 7;
        // Ensure we don't double-add: if hasNext was true and daysAhead was already > 0 before the first +7
        // We want at least 7 days ahead when "الجاي" is specified
      }
      const d = new Date(today);
      d.setDate(d.getDate() + daysAhead);
      return toDateString(d);
    }
  }

  // --- Explicit date with Arabic month name: "30 سبتمبر" or "30 سبتمبر 2026" ---
  {
    const monthKeys = Object.keys(ARABIC_MONTHS).sort((a, b) => b.length - a.length);
    const monthPattern = monthKeys.join('|');
    const monthNameRe = new RegExp('(\\d{1,2})\\s+(' + monthPattern + ')(?:\\s+(\\d{4}))?');
    const m = norm.match(monthNameRe);
    if (m?.[1] && m?.[2] && ARABIC_MONTHS[m[2]] !== undefined) {
      const day = parseInt(m[1], 10);
      const month = ARABIC_MONTHS[m[2]];
      const year = m[3] ? parseInt(m[3], 10) : today.getFullYear();
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // --- Explicit numeric dates: 30/9, 30-09-2026, 30.9.2026 ---
  {
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const fullDateRe = /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})/;
    const fullMatch = norm.match(fullDateRe);
    if (fullMatch?.[1] && fullMatch?.[2] && fullMatch?.[3]) {
      const day = parseInt(fullMatch[1], 10);
      const month = parseInt(fullMatch[2], 10);
      const year = parseInt(fullMatch[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // DD/MM or DD-MM or DD.MM (no year → current year)
    const shortDateRe = /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})(?!\s*[\/\-.]\s*\d)/;
    const shortMatch = norm.match(shortDateRe);
    if (shortMatch?.[1] && shortMatch?.[2]) {
      const day = parseInt(shortMatch[1], 10);
      const month = parseInt(shortMatch[2], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return `${today.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. Notes Parsing
// ---------------------------------------------------------------------------

/**
 * Keywords/phrases that introduce a note/reason section.
 * Sorted longest-first so longer phrases are matched before their substrings.
 */
const NOTES_KEYWORDS = [
  'والملاحظات',
  'والملاحظة',
  'الملاحظات',
  'الملاحظة',
  'ملاحظة:',
  'ملاحظة',
  'التفاصيل',
  'تفاصيل',
  'مقابل شراء',
  'مقابل',
  'على شان',
  'عشان',
  'بسبب',
  'السبب',
  'لشراء',
  'شراء',
];

/**
 * Phrases that are boilerplate in the transcript and should be stripped from notes.
 * These are verbs/fillers that wrap around the amount/date info.
 */
const BOILERPLATE_PATTERNS = [
  /سجل\s+(?:دين|عليه)/g,
  /سجل/g,
  /يستحق\s+الدفع/g,
  /الدفع/g,
  /بتاريخ/g,
  /تاريخ/g,
  /بقيمة/g,
  /بمبلغ/g,
  /عليه\s+مبلغ/g,
  /عليه/g,
  /المبلغ/g,
  /مبلغ/g,
  /قيمة/g,
  /دين/g,
];

/**
 * Extracts meaningful notes from the transcript, stripping amount, date, and
 * boilerplate fragments.
 *
 * Strategy:
 * 1. If a notes keyword is found, take everything after it.
 * 2. Otherwise, remove amount/date/boilerplate fragments and see if anything
 *    meaningful remains.
 * 3. If nothing meaningful remains, return "".
 */
export function parseNotes(text: string, parsedAmount: number | null, parsedDate: string | null): string {
  const norm = normalizeArabicText(text);

  // Strategy 1 — keyword-anchored extraction
  for (const kw of NOTES_KEYWORDS) {
    const kwNorm = normalizeArabicText(kw);
    const idx = norm.indexOf(kwNorm);
    if (idx !== -1) {
      let noteText = norm.slice(idx + kwNorm.length).trim();
      // Clean up leading punctuation / colon
      noteText = noteText.replace(/^[:\s،,]+/, '').trim();
      if (noteText) return noteText;
    }
  }

  // Strategy 2 — remove known fragments and see what's left
  let remaining = norm;

  // Remove amount + currency
  if (parsedAmount !== null) {
    // Remove the amount number and any surrounding currency words
    const amtStr = String(parsedAmount).replace('.', '\\.');
    const amtRe = new RegExp(
      '(?:بقيمة|بمبلغ|عليه\\s+مبلغ|عليه|المبلغ|مبلغ|قيمة|سجل\\s+دين|سجل\\s+عليه|دين)?\\s*' +
        amtStr +
        '\\s*(?:شيكل|شاقل|شواكل|شيقل|شيقيل|دينار|دولار|ريال|جنيه|ليرة|\\$|USD|ILS|JOD)?',
      'g',
    );
    remaining = remaining.replace(amtRe, ' ');
  }

  // Remove date fragments
  if (parsedDate) {
    // Remove explicit numeric date patterns
    remaining = remaining.replace(/\d{1,2}\s*[\/\-.]\s*\d{1,2}(?:\s*[\/\-.]\s*\d{4})?/g, ' ');

    // Remove Arabic month names with preceding day number
    const monthKeys = Object.keys(ARABIC_MONTHS).sort((a, b) => b.length - a.length);
    for (const mk of monthKeys) {
      const mkRe = new RegExp('\\d{1,2}\\s+' + mk + '(?:\\s+\\d{4})?', 'g');
      remaining = remaining.replace(mkRe, ' ');
      // Also remove standalone month name
      remaining = remaining.replace(new RegExp(mk, 'g'), ' ');
    }

    // Remove relative date expressions
    const relativeDatePatterns = [
      /بعد\s+بكرا/g, /بعد\s+بكرة/g, /بعد\s+غد/g, /بعد\s+الغد/g,
      /بكرا\s*(?:ان\s+شاء\s+الله)?/g, /بكرة\s*(?:ان\s+شاء\s+الله)?/g,
      /غدا/g, /غدا\u064b/g,
      /اليوم/g, /هاليوم/g,
      /بعد\s+يومين/g, /بعد\s+يوم/g,
      /بعد\s+اسبوعين/g, /بعد\s+اسبوع/g,
      /بعد\s+شهرين/g, /بعد\s+شهر/g,
      /بعد\s+\d+\s*(?:يوم|ايام|اسبوع|اسابيع|شهر|شهور|اشهر)/g,
      /اخر\s+(?:هذا\s+)?الشهر/g, /نهاية\s+الشهر/g, /بنهاية\s+الشهر/g,
      /(?:بداية|اول)\s+الشهر(?:\s+(?:القادم|الجاي))?/g,
    ];
    for (const rp of relativeDatePatterns) {
      remaining = remaining.replace(rp, ' ');
    }

    // Remove weekday expressions
    const weekdayKeys = Object.keys(WEEKDAYS).sort((a, b) => b.length - a.length);
    for (const wd of weekdayKeys) {
      const wdRe = new RegExp('(?:يوم\\s+)?' + wd + '(?:\\s+(?:الجاي|الجاية|القادم|القادمة))?', 'g');
      remaining = remaining.replace(wdRe, ' ');
    }
  }

  // Remove boilerplate
  for (const bp of BOILERPLATE_PATTERNS) {
    remaining = remaining.replace(bp, ' ');
  }

  // Remove any leftover standalone numbers (likely amount/date remnants)
  remaining = remaining.replace(/(?:^|\s)\d+(?:\.\d+)?(?:\s|$)/g, ' ');

  // Clean up punctuation and whitespace
  remaining = remaining.replace(/[،,.:;؛]+/g, ' ');
  remaining = remaining.replace(/\s+/g, ' ').trim();

  // If what remains is very short or just noise, return empty
  if (remaining.length < 2) return '';

  return remaining;
}

// ---------------------------------------------------------------------------
// 5. Main Orchestrator
// ---------------------------------------------------------------------------

export interface ParsedVoiceDebt {
  amount: number | null;
  dueDate: string | null;
  notes: string;
}

/**
 * Parses an Arabic voice transcript into structured debt fields.
 *
 * @param text - Raw transcript from SpeechRecognition.
 * @returns Parsed amount, dueDate (YYYY-MM-DD), and notes.
 *
 * @example
 * parseVoiceDebt("سجل دين بقيمة 500 شيكل يستحق الدفع بتاريخ 30 سبتمبر والملاحظات شراء مواد غذائية")
 * // → { amount: 500, dueDate: "2026-09-30", notes: "شراء مواد غذائية" }
 */
export function parseVoiceDebt(text: string): ParsedVoiceDebt {
  if (!text || !text.trim()) {
    return { amount: null, dueDate: null, notes: '' };
  }

  const amount = parseAmount(text);
  const dueDate = parseDueDate(text);
  const notes = parseNotes(text, amount, dueDate);

  return { amount, dueDate, notes };
}
