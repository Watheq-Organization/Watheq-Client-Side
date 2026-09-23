import type { FC, ReactNode } from 'react';

interface SocialAuthButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export const SocialAuthButton: FC<SocialAuthButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98] cursor-pointer"
    >
      <span>{label}</span>
      {icon}
    </button>
  );
};
