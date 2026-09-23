import type { FC, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/**
 * No Textarea component existed anywhere in the project (checked
 * src/components/ui and every existing form) — only single-line
 * <input> based fields. This mirrors IconInput's exact label/spacing/
 * focus-ring classNames so it matches the rest of the form system.
 */
export const Textarea: FC<TextareaProps> = ({ label, className, rows, ...textareaProps }) => {
  const baseClasses =
    'w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right resize-none';

  return (
    <div className="space-y-1.5 text-right">
      <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <textarea
        {...textareaProps}
        rows={rows ?? 3}
        className={className ? `${baseClasses} ${className}` : baseClasses}
      />
    </div>
  );
};
