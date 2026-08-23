import { useState } from 'react';
import type { FC, InputHTMLAttributes, ReactNode } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Optional element rendered at the opposite end of the label row (e.g. a "forgot password?" link on Login). Unused by Register. */
  labelExtra?: ReactNode;
}

/**
 * Same visual styling (classNames) as the password field already used in
 * the Signup form — extracted so the Login page can reuse identical
 * show/hide behavior and appearance without duplicating markup.
 */
export const PasswordInput: FC<PasswordInputProps> = ({ label, labelExtra, ...inputProps }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-right">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-semibold text-slate-700">{label}</label>
        {labelExtra}
      </div>
      <div className="relative flex items-center">
        <div className="absolute right-3.5 text-slate-400 pointer-events-none">
          <Lock className="w-4 h-4" />
        </div>
        <input
          {...inputProps}
          type={showPassword ? 'text' : 'password'}
          className="w-full pr-10 pl-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
