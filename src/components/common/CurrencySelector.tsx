import { useEffect, useState } from 'react';
import type { FC } from 'react';
import {
  type CurrencyCode,
  getCurrencyConfig,
  getCurrencyId,
  normalizeCurrencyCode,
} from '../../utils/currency';
import { getCurrencies, type CurrencyDto, DEFAULT_CURRENCIES } from '../../services/currencyService';

interface CurrencySelectorProps {
  value?: CurrencyCode | string | number;
  currencyId?: number;
  onChange?: (currency: CurrencyCode) => void;
  onChangeId?: (currencyId: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pills' | 'dropdown';
  className?: string;
  label?: string;
  showFullLabel?: boolean;
  currencies?: CurrencyDto[];
}

export const CurrencySelector: FC<CurrencySelectorProps> = ({
  value,
  currencyId,
  onChange,
  onChangeId,
  disabled = false,
  size = 'md',
  variant = 'dropdown',
  className = '',
  label,
  showFullLabel = false,
  currencies: propCurrencies,
}) => {
  const [loadedCurrencies, setLoadedCurrencies] = useState<CurrencyDto[]>(
    propCurrencies && propCurrencies.length > 0 ? propCurrencies : DEFAULT_CURRENCIES
  );

  useEffect(() => {
    if (!propCurrencies || propCurrencies.length === 0) {
      getCurrencies().then((list) => {
        if (list && list.length > 0) {
          setLoadedCurrencies(list);
        }
      });
    }
  }, [propCurrencies]);

  // Ensure all supported currencies (ILS, USD, JOD) are always selectable
  const currenciesList = (propCurrencies && propCurrencies.length > 0
    ? propCurrencies
    : loadedCurrencies
  ).reduce<CurrencyDto[]>((acc, curr) => {
    const code = normalizeCurrencyCode(curr.code);
    if (!acc.some((c) => normalizeCurrencyCode(c.code) === code)) {
      acc.push(curr);
    }
    return acc;
  }, [...DEFAULT_CURRENCIES].filter((def) => {
    const list = propCurrencies && propCurrencies.length > 0 ? propCurrencies : loadedCurrencies;
    return !list.some((c) => normalizeCurrencyCode(c.code) === def.code);
  }).concat(propCurrencies && propCurrencies.length > 0 ? propCurrencies : loadedCurrencies));

  // Resolve current active currency code: prioritize explicit value string, then mapped ID
  const activeCode: CurrencyCode = (() => {
    if (typeof value === 'string' && value.trim()) {
      return normalizeCurrencyCode(value);
    }
    const idToLookup = currencyId ?? (typeof value === 'number' ? value : undefined);
    if (idToLookup !== undefined) {
      const found = currenciesList.find((c) => c.id === idToLookup);
      if (found) {
        return normalizeCurrencyCode(found.code);
      }
      return normalizeCurrencyCode(idToLookup);
    }
    return normalizeCurrencyCode(value);
  })();

  const handleSelectCode = (nextCode: CurrencyCode) => {
    const matched = currenciesList.find(
      (c) => normalizeCurrencyCode(c.code) === nextCode
    );
    const nextId = matched?.id ?? getCurrencyId(nextCode);
    if (onChange) {
      onChange(nextCode);
    }
    if (onChangeId) {
      onChangeId(nextId);
    }
  };

  const handleSelectId = (newIdNum: number) => {
    const matched = currenciesList.find((c) => c.id === newIdNum);
    const code = matched ? normalizeCurrencyCode(matched.code) : normalizeCurrencyCode(newIdNum);
    if (onChange) {
      onChange(code);
    }
    if (onChangeId) {
      onChangeId(newIdNum);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`space-y-1.5 text-right ${className}`} dir="rtl">
        {label && (
          <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          value={activeCode}
          onChange={(e) => handleSelectCode(normalizeCurrencyCode(e.target.value))}
          disabled={disabled}
          className="w-full bg-[#F7F7FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 dark:focus:ring-blue-500/20 focus:border-[#00204F] dark:focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {currenciesList.map((curr) => {
            const code = normalizeCurrencyCode(curr.code);
            const conf = getCurrencyConfig(code);
            return (
              <option key={curr.id || code} value={code}>
                {conf.symbol} - {conf.labelArFull} ({code})
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  // Segmented Pill Buttons
  return (
    <div className={`space-y-1.5 text-right ${className}`} dir="rtl">
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div
        className={`grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {currenciesList.map((curr) => {
          const code = normalizeCurrencyCode(curr.code);
          const isSelected = activeCode === code;
          const conf = getCurrencyConfig(code);
          return (
            <button
              key={curr.id || code}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectId(curr.id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg transition-all font-cairo font-bold cursor-pointer select-none ${
                size === 'sm'
                  ? 'py-1.5 px-2 text-xs'
                  : size === 'lg'
                  ? 'py-3 px-4 text-sm'
                  : 'py-2 px-3 text-xs sm:text-sm'
              } ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-[#00204F] dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700 scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-sans text-base leading-none font-black text-[#00204F] dark:text-blue-400">
                {conf.symbol}
              </span>
              <span>{showFullLabel ? conf.labelArFull : conf.labelAr}</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                ({code})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
