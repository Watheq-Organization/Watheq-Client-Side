import type { FC, ChangeEvent } from 'react';

export type CountryCode = '970' | '972';

export interface PhoneInputWithCountryProps {
  countryCode: CountryCode;
  localNumber: string;
  onCountryCodeChange: (code: CountryCode) => void;
  onLocalNumberChange: (localNumber: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const COUNTRIES: { code: CountryCode; name: string; prefix: string; flag: string }[] = [
  { code: '970', name: 'فلسطين', prefix: '+970', flag: '🇵🇸' },
  { code: '972', name: 'إسرائيل', prefix: '+972', flag: '🇮🇱' },
];

/**
 * Sanitizes input text into a valid 9-digit local phone number.
 * - Strips all non-digit characters.
 * - Detects pasted +970 / +972 / 00970 / 00972 prefixes.
 * - Automatically removes leading '0' (e.g., '059...' becomes '59...').
 * - Truncates to at most 9 digits.
 */
function sanitizePhoneInput(
  rawInput: string
): { localNumber: string; detectedCountryCode?: CountryCode } {
  let cleaned = rawInput.replace(/\D/g, '');
  let detectedCountryCode: CountryCode | undefined;

  // Check if full international number was pasted (e.g. 970599123456 or 972501234567)
  if (cleaned.startsWith('970') && cleaned.length > 9) {
    detectedCountryCode = '970';
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('972') && cleaned.length > 9) {
    detectedCountryCode = '972';
    cleaned = cleaned.slice(3);
  }

  // Remove leading 0 (e.g. 059... becomes 59...)
  cleaned = cleaned.replace(/^0+/, '');

  // Keep at most 9 digits
  cleaned = cleaned.slice(0, 9);

  return { localNumber: cleaned, detectedCountryCode };
}

export const PhoneInputWithCountry: FC<PhoneInputWithCountryProps> = ({
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  label = 'رقم الجوال',
  required = false,
  error,
  placeholder = '59XXXXXXX (9 أرقام)',
  disabled = false,
  id,
}) => {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { localNumber: cleanNum, detectedCountryCode } = sanitizePhoneInput(
      e.target.value
    );

    if (detectedCountryCode && detectedCountryCode !== countryCode) {
      onCountryCodeChange(detectedCountryCode);
    }
    onLocalNumberChange(cleanNum);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-[#09152B] dark:text-slate-200 mb-1.5 text-right"
        >
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <div
        className={`flex items-center rounded-xl border bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors ${
          error
            ? 'border-rose-400 dark:border-rose-500 focus-within:border-rose-500'
            : 'border-slate-300 dark:border-slate-700 focus-within:border-[#09152B] dark:focus-within:border-slate-400 focus-within:bg-white dark:focus-within:bg-slate-900'
        } ${disabled ? 'opacity-60 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : ''}`}
        dir="rtl"
      >
        {/* Country Code Dropdown */}
        <div className="relative bg-slate-100/90 dark:bg-slate-800 border-l border-slate-300 dark:border-slate-700 shrink-0">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value as CountryCode)}
            disabled={disabled}
            aria-label="مقدمة الدولة"
            className="h-10 appearance-none bg-transparent pl-7 pr-3 text-xs sm:text-[13px] font-bold text-[#09152B] dark:text-slate-200 outline-none cursor-pointer text-right hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {c.flag} {c.name} ({c.prefix})
              </option>
            ))}
          </select>
          {/* Custom Arrow Icon */}
          <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* 9-Digit Local Phone Number Input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10} // Allow typing 10 so leading 0 can be typed and stripped automatically
          value={localNumber}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          dir="ltr"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hintId}
          className="flex-1 h-10 px-3.5 text-sm text-right sm:text-left font-jakarta tabular-nums font-semibold text-[#09152B] dark:text-white placeholder:text-slate-400 outline-none bg-transparent"
        />
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 text-right">
          {error}
        </p>
      ) : (
        <p id={hintId} className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">
          أدخل 9 أرقام بدون 0 في البداية (مثال: 599123456).
        </p>
      )}
    </div>
  );
};
