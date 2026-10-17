import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ArrowLeft, 
  Sliders, 
  Building2, 
  Users, 
  Plus, 
  Minus, 
  BookOpenCheck,
  Receipt,
  Boxes,
  Landmark,
  Store
} from 'lucide-react';
import { PATHS } from '../../routes/paths';

export const CustomPlanBuilderSection: React.FC = () => {
  const navigate = useNavigate();

  // Interactive modules
  const availableModules = [
    { id: 'debts', name: 'الديون والتوثيق', icon: BookOpenCheck, basePrice: 40, isCore: true },
    { id: 'pos', name: 'المبيعات والكاشير', icon: Receipt, basePrice: 30, isCore: false },
    { id: 'inventory', name: 'إدارة المخزون', icon: Boxes, basePrice: 25, isCore: false },
    { id: 'reconciliation', name: 'مطابقة التحويلات البنكية', icon: Landmark, basePrice: 35, isCore: false },
    { id: 'roles', name: 'الموظفين والصلاحيات', icon: Users, basePrice: 20, isCore: false },
    { id: 'branches', name: 'إدارة الفروع', icon: Store, basePrice: 45, isCore: false },
  ];

  const [selectedModules, setSelectedModules] = useState<string[]>([
    'debts',
    'pos',
    'reconciliation',
  ]);
  const [branchCount, setBranchCount] = useState<number>(1);
  const [userCount, setUserCount] = useState<number>(2);

  const toggleModule = (id: string) => {
    // Keep 'debts' always selected as core
    if (id === 'debts') return;
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  // Price Calculation formula
  // Base price 39 ₪
  // + Sum of module prices
  // + Extra branches (35 ₪ per branch beyond 1)
  // + Extra users (10 ₪ per user beyond 1)
  const calculateTotal = () => {
    const modulesSum = selectedModules.reduce((acc, mId) => {
      const found = availableModules.find(m => m.id === mId);
      return acc + (found ? found.basePrice : 0);
    }, 0);
    const extraBranches = Math.max(0, branchCount - 1) * 35;
    const extraUsers = Math.max(0, userCount - 1) * 10;
    return modulesSum + extraBranches + extraUsers;
  };

  const totalPrice = calculateTotal();

  return (
    <section className="py-20 relative overflow-hidden bg-slate-50/60 dark:bg-[#0B132B]/50 border-t border-slate-200/80 dark:border-white/5 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Card Container */}
        <div className="bg-white dark:bg-[#111C35] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-10 lg:p-12 shadow-xl">
          
          {/* Header */}
          <div className="text-right space-y-2 mb-10 pb-6 border-b border-slate-100 dark:border-white/10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs font-bold mb-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>مُفصّل على مقاسك</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white font-cairo">
              خطة مخصصة: ركّب الخطة على قدّ محلك
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal">
              اختَر الوحدات التي يحتاجها متجرك وحدد عدد الفروع والمستخدمين لتفصيل باقتك بدقة وبدون دفع فلس واحد لميزات لا تحتاجها.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Right Column (Controls): Modules Selection & Steppers (RTL start) */}
            <div className="lg:col-span-7 space-y-8 text-right">
              
              {/* Modules Grid */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#0F172A] dark:text-white block">
                  1. حدد الوحدات والمزايا المطلوبة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableModules.map((mod) => {
                    const isSelected = selectedModules.includes(mod.id);
                    const IconComp = mod.icon;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          isSelected
                            ? 'bg-[#E6F9F0]/70 dark:bg-[#00D685]/10 border-[#00D685] text-[#0B132B] dark:text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-[#0B132B] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#00D685] text-[#0B132B]'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold">
                              {mod.name}
                            </div>
                            {mod.isCore && (
                              <div className="text-[10px] text-[#00A86B] dark:text-[#00D685] font-semibold">
                                وحدة أساسية إلزامية
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#00D685] border-[#00D685] text-[#0B132B]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Steppers: Branches & Users */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <label className="text-sm font-bold text-[#0F172A] dark:text-white block">
                  2. حدد حجم النشاط (الفروع والموظفين):
                </label>

                {/* Branches Stepper */}
                <div className="bg-slate-50 dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                        عدد الفروع
                      </div>
                      <div className="text-[11px] text-slate-400">
                        الفرع الأول مشمول، +35 ₪ لكل فرع إضافي
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBranchCount(Math.max(1, branchCount - 1))}
                      disabled={branchCount <= 1}
                      className="w-8 h-8 rounded-full bg-white dark:bg-[#111C35] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black font-mono text-base text-[#0F172A] dark:text-white">
                      {branchCount}
                    </span>
                    <button
                      onClick={() => setBranchCount(Math.min(10, branchCount + 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-[#111C35] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Users Stepper */}
                <div className="bg-slate-50 dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                        عدد المستخدمين / الموظفين
                      </div>
                      <div className="text-[11px] text-slate-400">
                        مستخدم أول مشمول، +10 ₪ لكل موظف إضافي
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUserCount(Math.max(1, userCount - 1))}
                      disabled={userCount <= 1}
                      className="w-8 h-8 rounded-full bg-white dark:bg-[#111C35] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black font-mono text-base text-[#0F172A] dark:text-white">
                      {userCount}
                    </span>
                    <button
                      onClick={() => setUserCount(Math.min(25, userCount + 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-[#111C35] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Left Column (Summary Panel): Dynamic Price & CTA */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0B132B] to-[#111C35] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl text-right space-y-6">
              
              <div className="pb-4 border-b border-white/10">
                <span className="text-xs font-bold text-[#00D685]">ملخص خطتك المخصصة</span>
                <h3 className="text-xl font-black text-white mt-1">
                  الباقة الشهرية التقديرية
                </h3>
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>الوحدات المختارة ({selectedModules.length} وحدات):</span>
                  <span className="font-mono font-bold text-white">
                    {selectedModules.reduce((acc, mId) => {
                      const found = availableModules.find(m => m.id === mId);
                      return acc + (found ? found.basePrice : 0);
                    }, 0)} ₪
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>الفروع ({branchCount} فرع):</span>
                  <span className="font-mono font-bold text-white">
                    {Math.max(0, branchCount - 1) * 35} ₪
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>المستخدمين ({userCount} مستخدم):</span>
                  <span className="font-mono font-bold text-white">
                    {Math.max(0, userCount - 1) * 10} ₪
                  </span>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs text-slate-400 block">الإجمالي الشهري:</span>
                    <span className="text-[10px] text-[#00D685]">بدون عقود طويلة الأجل</span>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl sm:text-5xl font-black text-[#00D685] font-mono">
                      {totalPrice}
                    </span>
                    <span className="text-sm font-bold text-white mr-1">₪ / شهرياً</span>
                  </div>
                </div>
              </div>

              {/* Included perks */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D685]" />
                  <span>دعم كامل للعمل بدون إنترنت أوفلاين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D685]" />
                  <span>رسائل توثيق غير محدودة عبر تليجرام وواتساب</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D685]" />
                  <span>نسخ احتياطي سحابي مشفر يومياً</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate(PATHS.REGISTER)}
                className="w-full py-4 px-6 rounded-full text-base font-extrabold text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] shadow-[0_8px_24px_-4px_rgba(0,214,133,0.5)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>اطلب هذه الخطة</span>
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1.5" />
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
