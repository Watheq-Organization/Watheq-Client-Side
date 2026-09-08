
import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { Loader2, AlertCircle} from 'lucide-react';
import { getRecentActivities, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import type { RecentActivityItem } from '../../types/dashboard';

export const RecentActivities: FC = () => {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getRecentActivities()
      .then((data) => {
        setActivities(data);
      })
      .catch((err) => {
        setError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Always display only the latest 5 activities
  const displayedActivities = activities.slice(0, 5);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between transition-all duration-300"
      dir="rtl"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold font-tajawal text-slate-900">
            أحدث النشاطات
          </h2>
          {activities.length > 0 && (
            <span className="text-xs font-semibold text-slate-400 font-cairo">
              ({activities.length})
            </span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="underline text-xs font-bold cursor-pointer hover:no-underline"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Timeline List Container */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0f284e]" />
            <span className="text-xs font-medium font-tajawal">جاري تحميل النشاطات...</span>
          </div>
        ) : displayedActivities.length > 0 ? (
          <div className="relative pr-4">
            {/* Vertical continuous line */}
            <div className="absolute top-2.5 bottom-6 right-[7px] w-0.5 bg-slate-200" />

            <div className="space-y-6">
              {displayedActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  {/* Dot */}
                  <div
                    className={`relative z-10 mt-1 w-3.5 h-3.5 rounded-full ${activity.dotColor} ring-4 ring-white shrink-0`}
                  />

                  {/* Content */}
                  <div className="flex-1 text-right">
                    <span className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                      {activity.time}
                    </span>
                    <h3 className="text-sm font-bold font-tajawal text-slate-900 leading-snug">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm">
            لا توجد نشاطات حديثة حالياً في قاعدة البيانات
          </div>
        )}
      </div>
    </div>
  );
};


