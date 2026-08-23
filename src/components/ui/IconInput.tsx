import type { FC, InputHTMLAttributes, ReactNode } from 'react';

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  label: string;
}

/**
 * Same visual styling (classNames) as the icon+input fields already used
 * in the Signup form — extracted so it can be reused without duplicating
 * markup. The original form used two distinct input classNames: Arabic
 * text fields (store/full name) with no `font-sans`, and Latin/numeric
 * fields (phone, email) WITH `font-sans` — which overrides the page's
 * inherited Cairo font for those specific fields. That distinction is
 * preserved here as the default (no `font-sans`, matching store/full
 * name); callers that need the `font-sans` variant (phone, email) pass
 * `className` explicitly so no field's font silently changes.
 */
export const IconInput: FC<IconInputProps> = ({ icon, label, className, ...inputProps }) => {
  return (
    <div className="space-y-1.5 text-right">
      <label className="text-xs sm:text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative flex items-center">
        <div className="absolute right-3.5 text-slate-400 pointer-events-none">{icon}</div>
        <input
          {...inputProps}
          className={
            className ??
            'w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right'
          }
        />
      </div>
    </div>
  );
};

/** The `font-sans` variant classNames, for Latin/numeric fields (phone, email) — matches the original Signup form exactly. */
export const ICON_INPUT_FONT_SANS_CLASSNAME =
  'w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans';
