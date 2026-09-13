/**
 * Date and time utilities for converting backend UTC timestamps into the device's actual local time.
 *
 * ASP.NET Core EF Core backend records transactions in UTC (DateTime.UtcNow),
 * but its JSON serializer often outputs ISO strings without a trailing 'Z'
 * (e.g. "2026-09-12T15:20:00"). Without 'Z', standard JavaScript Date parsing
 * incorrectly treats the string as local time, causing the user to see Greenwich time
 * (e.g. 3:20 PM) instead of their actual device time (e.g. 6:20 PM in GMT+3).
 */

/**
 * Normalizes an API ISO date/time string so that UTC timestamps without a trailing 'Z'
 * are correctly identified as UTC, allowing the browser to translate them into local device time.
 */
export function normalizeApiDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Already has timezone specifier: Z or +HH:mm / -HH:mm
  if (trimmed.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed;
  }

  // Date-time with 'T' separator (e.g. "2026-09-12T15:20:00" or with milliseconds)
  if (trimmed.includes('T')) {
    return `${trimmed}Z`;
  }

  // Date-time with space separator (e.g. "2026-09-12 15:20:00")
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`;
  }

  // Date-only (e.g. "2026-09-12") - keep as-is
  return trimmed;
}

/**
 * Parses an API date string into a JavaScript Date object, converting UTC timestamps
 * to the device's actual local time.
 */
export function parseApiDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(NaN);
  const trimmed = dateStr.trim();
  if (!trimmed) return new Date(NaN);

  // If pure date-only (YYYY-MM-DD), parse in local timezone to prevent day shifting
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (year !== undefined && month !== undefined && day !== undefined) {
      return new Date(year, month - 1, day);
    }
  }

  const normalized = normalizeApiDateString(trimmed);
  return new Date(normalized);
}

/**
 * Formats an API date string into Arabic, taking into account the device's local time.
 * If withTime is true, includes the 12-hour local time (e.g. "٠٦:٢٠ م").
 */
export function formatApiDate(dateStr: string | null | undefined, withTime: boolean = false): string {
  if (!dateStr) return '';
  const date = parseApiDate(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  }).format(date);
}

/**
 * Returns today's date in YYYY-MM-DD according to the device's actual local timezone.
 */
export function getDeviceLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date relative to now in Arabic (e.g. "الآن", "منذ ١٥ دقيقة", "أمس"),
 * properly calculating elapsed time using device local time vs UTC.
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'مؤخراً';
  try {
    const d = parseApiDate(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    // If future or less than 1 minute ago, show "الآن"
    if (diffMs < 60 * 1000) return 'الآن';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 5) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes.toLocaleString('ar-SA')} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours.toLocaleString('ar-SA')} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays.toLocaleString('ar-SA')} أيام`;

    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
