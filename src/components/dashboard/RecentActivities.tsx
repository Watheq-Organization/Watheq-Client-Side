import type { FC } from 'react';

interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  dotColor: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    time: 'منذ ساعتين',
    title: 'تم استلام دفعة',
    description: 'قام عبدالله محمد بسداد مبلغ ٥,٠٠٠ ر.س.',
    dotColor: 'bg-[#22c55e]',
  },
  {
    id: '2',
    time: 'أمس، ١٤:٣٠',
    title: 'إضافة دين جديد',
    description: 'تم تسجيل دين بقيمة ١٢,٠٠٠ ر.س على مؤسسة الإعمار',
    dotColor: 'bg-[#0f284e]',
  },
  {
    id: '3',
    time: 'أمس، ٠٩:١٥',
    title: 'تم استلام دفعة',
    description: 'قامت سارة أحمد بسداد مبلغ ٣,٥٠٠ ر.س.',
    dotColor: 'bg-[#22c55e]',
  },
  {
    id: '4',
    time: 'أمس، ٠٨:٠٠',
    title: 'إرسال تذكير',
    description: 'تم إرسال تذكير تلقائي لخالد علي بخصوص دفعته المتأخرة.',
    dotColor: 'bg-[#94a3b8]',
  },
];

export const RecentActivities: FC = () => {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between"
      dir="rtl"
    >
      <div>
        {/* Header */}
        <h2 className="text-lg font-bold font-tajawal text-slate-900 mb-6">
          أحدث النشاطات
        </h2>

        {/* Timeline List */}
        <div className="relative pr-4">
          {/* Vertical continuous line */}
          <div className="absolute top-2.5 bottom-6 right-[7px] w-0.5 bg-slate-200" />

          <div className="space-y-6">
            {ACTIVITIES.map((activity) => (
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
      </div>

      {/* Footer Link */}
      <div className="pt-4 mt-4 border-t border-slate-100 text-center">
        <button
          type="button"
          className="text-xs sm:text-sm font-bold font-tajawal text-[#051838] hover:text-[#183462] hover:underline transition-all duration-150"
        >
          عرض جميع النشاطات
        </button>
      </div>
    </div>
  );
};
