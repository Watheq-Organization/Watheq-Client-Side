import type { FC, ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
}

/**
 * No Select/dropdown component existed anywhere in the project (checked
 * src/components/ui, src/components/dashboard, src/components/auth) —
 * only plain <input> based fields (IconInput, PasswordInput). This
 * mirrors IconInput's exact classNames/spacing/label pattern so it looks
 * and behaves like a native part of the same form system, with a
 * trailing chevron (standard select affordance) instead of a leading
 * icon slot's twin on the right.
 */
export const Select: FC<SelectProps> = ({
  icon,
  label,
  options,
  placeholder,
  className,
  ...selectProps
}) => {
  return (
    <div className="space-y-1.5 text-right">
      <label className="text-xs sm:text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative flex items-center">
        {icon && <div className="absolute right-3.5 text-slate-400 pointer-events-none">{icon}</div>}
        <select
          {...selectProps}
          className={
            className ??
            `w-full ${icon ? 'pr-10' : 'pr-3.5'} pl-9 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right appearance-none cursor-pointer`
          }
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};
