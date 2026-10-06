import { useState, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Copy,
  Check,
  Edit,
  Truck,
  Trash2,
  Filter,
  Layers,
  ArrowUpDown,
  ShoppingCart,
} from 'lucide-react';
import { useInventoryPos } from '../../context/InventoryPosContext';
import type { Product, StockFilter } from '../../types/inventory';
import { ProductModal } from './ProductModal';
import { RestockModal } from './RestockModal';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Toast, type ToastType } from '../ui/Toast';
import { PATHS } from '../../routes/paths';

export const InventoryScreen: FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = useInventoryPos();

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price'>('name');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(null);

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  // Toast & Copy status
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = products.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalEstimatedValue = 0;

    for (const p of products) {
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= p.minAlertThreshold) {
        lowStockCount++;
      }
      totalEstimatedValue += p.stock * p.costPrice;
    }

    return {
      totalCount,
      lowStockCount,
      outOfStockCount,
      totalEstimatedValue: Math.round(totalEstimatedValue),
    };
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      // Category
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      // Stock status filter
      let matchesStock = true;
      if (stockFilter === 'in_stock') {
        matchesStock = p.stock > p.minAlertThreshold;
      } else if (stockFilter === 'low_stock') {
        matchesStock = p.stock > 0 && p.stock <= p.minAlertThreshold;
      } else if (stockFilter === 'out_of_stock') {
        matchesStock = p.stock <= 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      if (sortBy === 'price') return b.salePrice - a.salePrice;
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Barcode copy handler
  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setToast({ message: `تم نسخ الباركود (${barcode}) إلى الحافظة`, type: 'info' });
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  // Delete product handler
  const handleConfirmDelete = () => {
    if (!deleteConfirmProduct) return;
    deleteProduct(deleteConfirmProduct.id);
    setToast({
      message: `تم حذف الصنف (${deleteConfirmProduct.name}) من المخزون بنجاح`,
      type: 'success',
    });
    setDeleteConfirmProduct(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-cairo overflow-hidden" dir="rtl">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="inventory"
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:mr-72">
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} title="إدارة الأصناف والمخزون" />

        {/* Content Scroll Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Bar: Title & Primary CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    إدارة الأصناف والمخزون
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    متابعة الأرصدة، تسعير المنتجات، وإدارة التوريد المباشر لنقاط البيع
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* POS Cashier Quick Shortcut */}
              <button
                type="button"
                onClick={() => navigate(PATHS.POS)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>شاشة الكاشير (POS) ⚡</span>
              </button>

              {/* Add Product Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة صنف جديد</span>
              </button>
            </div>
          </div>

          {/* 4 Quick Insight Cards (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Products */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  إجمالي الأصناف المعرفة
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {kpis.totalCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">صنف مسجل بالنظام</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: Low Stock Warning */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                  أوشكت على النفاد 🟡
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {kpis.lowStockCount}
                </span>
                <span className="text-[11px] text-amber-600/70 block mt-1">تحت حد التنبيه المحدد</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: Out of Stock */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-rose-900/40 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                  أصناف نفدت بالكامل 🔴
                </span>
                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                  {kpis.outOfStockCount}
                </span>
                <span className="text-[11px] text-rose-600/70 block mt-1">الرصيد الفعلي صفر بالمحل</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: Total Inventory Value */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                  القيمة التقديرية للمخزون
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ₪{kpis.totalEstimatedValue.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600/70 block mt-1">بحسب سعر التكلفة</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالباركود، اسم الصنف، أو القسم..."
                  className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all">جميع الأقسام ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Sort selector */}
                <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="name">ترتيب بالاسم أبجدياً</option>
                  <option value="stock_asc">الأقل مخزوناً أولاً</option>
                  <option value="stock_desc">الأعلى مخزوناً أولاً</option>
                  <option value="price">الأعلى سعراً أولاً</option>
                </select>
              </div>
            </div>

            {/* Stock Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>حالة الرصيد:</span>
              </span>

              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  stockFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                الكل ({products.length})
              </button>

              <button
                type="button"
                onClick={() => setStockFilter('in_stock')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  stockFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                🟢 متوفر ({products.filter((p) => p.stock > p.minAlertThreshold).length})
              </button>

              <button
                type="button"
                onClick={() => setStockFilter('low_stock')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  stockFilter === 'low_stock'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                }`}
              >
                🟡 أوشك على النفاد ({kpis.lowStockCount})
              </button>

              <button
                type="button"
                onClick={() => setStockFilter('out_of_stock')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                }`}
              >
                🔴 نفد بالكامل ({kpis.outOfStockCount})
              </button>
            </div>
          </div>

          {/* Interactive Products Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">الباركود</th>
                    <th className="py-3.5 px-4">اسم الصنف والقسم</th>
                    <th className="py-3.5 px-4">سعر البيع</th>
                    <th className="py-3.5 px-4">سعر التكلفة</th>
                    <th className="py-3.5 px-4">رصيد المخزون</th>
                    <th className="py-3.5 px-4 text-center">حد التنبيه</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs sm:text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          لا توجد أصناف مطابقة لبحثك
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          يمكنك تعديل البحث أو الضغط على زر إضافة صنف جديد
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      // Status badge determination
                      const isOutOfStock = product.stock <= 0;
                      const isLowStock = !isOutOfStock && product.stock <= product.minAlertThreshold;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          {/* Barcode with copy button */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                {product.barcode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBarcode(product.barcode)}
                                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors"
                                title="نسخ الباركود"
                              >
                                {copiedBarcode === product.barcode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Product Name & Category */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {product.category || 'عام'}
                              </span>
                              {product.isQuickItem && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  سريع الكاشير ⚡
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Sale Price */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              ₪{product.salePrice.toFixed(2)}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            ₪{product.costPrice.toFixed(2)}
                          </td>

                          {/* Stock Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base text-slate-900 dark:text-white">
                                {product.stock}
                              </span>
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  نفد 🔴
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  منخفض 🟡
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  متوفر 🟢
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Min Alert Threshold */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center text-slate-400 font-mono">
                            {product.minAlertThreshold}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Restock button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRestockTargetProduct(product);
                                  setIsRestockModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 flex items-center gap-1 transition-all"
                                title="توريد كميات جديدة"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">توريد</span>
                              </button>

                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="تعديل الصنف"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmProduct(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                عرض {filteredProducts.length} من أصل {products.length} صنف مسجل
              </span>
              <span className="font-mono">نظام وثّق لإدارة المخزون ونقاط البيع الفورية</span>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={(productData) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, productData);
            setToast({ message: `تم تحديث الصنف (${productData.name}) بنجاح`, type: 'success' });
          } else {
            addProduct(productData);
            setToast({ message: `تمت إضافة الصنف (${productData.name}) للمخزون`, type: 'success' });
          }
        }}
        editingProduct={editingProduct}
        existingProducts={products}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockTargetProduct(null);
        }}
        product={restockTargetProduct}
        onConfirm={(productId, payload) => {
          restockProduct(productId, payload);
          setToast({
            message: `تم توريد +${payload.quantity} وحدة للصنف بنجاح`,
            type: 'success',
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          dir="rtl"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              تأكيد حذف الصنف
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              هل أنت متأكد من حذف الصنف ({deleteConfirmProduct.name}) من المخزون؟ لن يتم حذفه من
              الفواتير السابقة.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                نعم، احذف الصنف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
