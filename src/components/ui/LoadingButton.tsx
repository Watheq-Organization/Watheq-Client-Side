import type { FC, ReactNode } from 'react';

interface LoadingButtonProps {
  isLoading: boolean;
  loadingLabel: string;
  children: ReactNode;
}

/**
 * Same visual styling (classNames) and spinner markup as the Signup
 * form's submit button — extracted so the Login page's submit button
 * looks and behaves identically without duplicating markup.
 */
export const LoadingButton: FC<LoadingButtonProps> = ({ isLoading, loadingLabel, children }) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-[#007a3d] hover:bg-[#006633] text-white py-3 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-800/15 hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
