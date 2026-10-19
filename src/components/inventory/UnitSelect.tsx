import { useState, useRef, useEffect, type FC } from 'react';
import { Scale, ChevronDown, Check, AlertTriangle, X, Search } from 'lucide-react';
import { PRODUCT_UNITS } from '../../constants/productOptions';

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  options?: readonly string[];
  disabled?: boolean;
}

export const UnitSelect: FC<UnitSelectProps> = ({
  value,
  onChange,
  error,
  label = 'وحدة الصنف *',
  placeholder = 'اختر وحدة الصنف...',
  options = PRODUCT_UNITS,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((unit) =>
    unit.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleSelect = (unit: string) => {
    onChange(unit);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Popular quick units for quick 1-click access
  const quickUnits = ['حبة', 'باكو', 'كرتونة', 'كيلوغرام', 'لتر', 'علبة'];

  return (
    <div className="space-y-1.5 text-right relative" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{label}</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-right flex items-center justify-between transition-all outline-hidden cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50'
            : 'bg-slate-50 dark:bg-slate-800 hover:border-emerald-500/50'
        } ${
          error
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 dark:border-slate-700'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {value ? (
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {value}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange('');
                }
              }}
              className="p-1 hover:text-rose-500 rounded-md transition-colors"
              title="إلغاء التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fadeIn">
          {/* Quick presets strip */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block mb-1">وحدات شائعة:</span>
            <div className="flex flex-wrap gap-1">
              {quickUnits.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    value === u
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن وحدة..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options Grid/List */}
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50 dark:divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                لا توجد نتائج مطابقة لـ "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((unit) => {
                const isSelected = value === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleSelect(unit)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-right flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{unit}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
