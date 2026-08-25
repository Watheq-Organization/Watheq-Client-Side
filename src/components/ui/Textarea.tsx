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
  return (
    <div className="space-y-1.5 text-right">
      <label className="text-xs sm:text-sm font-semibold text-slate-700">{label}</label>
      <textarea
        {...textareaProps}
        rows={rows ?? 5}
        className={
          className ??
          'w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right resize-none'
        }
      />
    </div>
  );
};
