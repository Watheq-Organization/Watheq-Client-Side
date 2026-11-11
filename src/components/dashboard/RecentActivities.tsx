import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RotateCw, Activity } from 'lucide-react';
import { getRecentActivities, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import type { RecentActivityItem } from '../../types/dashboard';

interface RecentActivitiesProps {
  refreshTrigger?: number;
}

const INITIAL_VISIBLE_ACTIVITIES = 5;

export const RecentActivities: FC<RecentActivitiesProps> = ({ refreshTrigger = 0 }) => {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = useCallback((isMountedCheck?: () => boolean) => {
    getRecentActivities()
      .then((data) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setActivities(data);
        setError(null);
      })
      .catch((err) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        if (isMountedCheck && !isMountedCheck()) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchData(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchData, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchData();
  };

  const displayedActivities = isExpanded
    ? activities
    : activities.slice(0, INITIAL_VISIBLE_ACTIVITIES);

  const resolveIndicatorColor = (activity: RecentActivityItem) => {
    if (
      activity.category === 'payment' ||
      activity.dotColor.includes('22c55e') ||
      activity.dotColor.includes('emerald')
    ) {
      return 'bg-emerald-500 dark:bg-emerald-400';
    }
    return 'bg-slate-400 dark:bg-slate-500';
  };

  return (
    <div
      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold font-cairo text-slate-900 dark:text-white">
              آخر الحركات
            </h2>
            {!isLoading && activities.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold tabular-nums font-jakarta">
                {activities.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            سجل الدفعات والقيود المالية الأخيرة
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 underline text-xs font-bold cursor-pointer hover:no-underline shrink-0"
          >
            <RotateCw className="w-3 h-3" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Timeline Body */}
      <div className="p-5 flex-1">
        {isLoading ? (
          <div className="space-y-5">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-28 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          <div
            className={`relative pr-4 transition-all duration-200 ${
              isExpanded ? 'max-h-[420px] overflow-y-auto pl-1.5' : ''
            }`}
            style={
              isExpanded
                ? {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent',
                  }
                : undefined
            }
          >
            {/* Hairline Vertical Connector */}
            <div
              className="absolute top-2 bottom-4 right-[5px] w-px bg-slate-200 dark:bg-slate-800 pointer-events-none"
              aria-hidden="true"
            />

            <div className="space-y-5">
              {displayedActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-3.5">
                  {/* Semantic Indicator Dot */}
                  <div
                    className={`relative z-10 mt-1.5 w-2.5 h-2.5 rounded-full ${resolveIndicatorColor(
                      activity
                    )} ring-4 ring-white dark:ring-[#111827] shrink-0`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[13px] font-semibold font-cairo text-slate-900 dark:text-slate-100 leading-snug truncate">
                        {activity.title}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-cairo">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo">
              لا توجد حركات مسجّلة حتى الآن
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
              ستظهر هنا أحدث عمليات إضافة الديون وتحصيل الدفعات.
            </p>
          </div>
        )}
      </div>

      {/* Expand / Collapse Footer */}
      {!isLoading && activities.length > INITIAL_VISIBLE_ACTIVITIES && (
        <div className="px-5 py-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors tabular-nums"
          >
            <span>
              {isExpanded
                ? 'عرض أقل'
                : `عرض كل الحركات (${activities.length})`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
