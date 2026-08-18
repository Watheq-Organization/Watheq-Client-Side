export interface PaymentTransaction {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientInitial: string;
  clientAvatarBg: string;
  clientType: string;
  amount: number;
  date: string;
  time: string;
  paymentMethod: 'تحويل بنكي' | 'نقداً' | 'سداد' | 'بطاقة مدى' | 'بطاقة ائتمانية';
  status: 'تم التحقق' | 'قيد الانتظار' | 'ملغاة';
  statusType: 'verified' | 'pending' | 'cancelled';
  receiptNo: string;
}

export interface FinancialReportItem {
  id: string;
  title: string;
  createdDate: string;
  type: 'مالي' | 'ديون' | 'عملاء';
  typeColor: string;
  status: 'مكتمل' | 'قيد التجهيز';
  fileSize: string;
  format: 'PDF' | 'XLSX';
}

export const INITIAL_PAYMENT_LOGS: PaymentTransaction[] = [
  {
    id: 'pay-1',
    clientName: 'محمد العتيبي',
    clientInitial: 'م',
    clientAvatarBg: 'bg-emerald-600 text-white',
    clientType: 'أفراد',
    amount: 4500.00,
    date: '24 أكتوبر 2023',
    time: '10:32 ص',
    paymentMethod: 'تحويل بنكي',
    status: 'تم التحقق',
    statusType: 'verified',
    receiptNo: 'REC-9082',
  },
  {
    id: 'pay-2',
    clientName: 'سارة الشمري',
    clientInitial: 'س',
    clientAvatarBg: 'bg-purple-600 text-white',
    clientType: 'أفراد',
    amount: 1250.00,
    date: '24 أكتوبر 2023',
    time: '09:15 ص',
    paymentMethod: 'نقداً',
    status: 'قيد الانتظار',
    statusType: 'pending',
    receiptNo: 'REC-9081',
  },
  {
    id: 'pay-3',
    clientName: 'فهد الدوسري',
    clientInitial: 'ف',
    clientAvatarBg: 'bg-blue-600 text-white',
    clientType: 'شركات',
    amount: 12000.00,
    date: '23 أكتوبر 2023',
    time: '04:45 م',
    paymentMethod: 'سداد',
    status: 'تم التحقق',
    statusType: 'verified',
    receiptNo: 'REC-9080',
  },
  {
    id: 'pay-4',
    clientName: 'أحمد عبدالله الراجحي',
    clientInitial: 'أ',
    clientAvatarBg: 'bg-[#0b1d3a] text-white',
    clientType: 'أفراد',
    amount: 500.00,
    date: '23 أكتوبر 2023',
    time: '01:20 م',
    paymentMethod: 'بطاقة مدى',
    status: 'تم التحقق',
    statusType: 'verified',
    receiptNo: 'REC-9079',
  },
  {
    id: 'pay-5',
    clientName: 'شركة التقنية المتقدمة',
    clientInitial: 'ش',
    clientAvatarBg: 'bg-indigo-600 text-white',
    clientType: 'شركات',
    amount: 35000.00,
    date: '22 أكتوبر 2023',
    time: '11:00 ص',
    paymentMethod: 'تحويل بنكي',
    status: 'تم التحقق',
    statusType: 'verified',
    receiptNo: 'REC-9078',
  },
  {
    id: 'pay-6',
    clientName: 'مؤسسة الأفق للبناء',
    clientInitial: 'م',
    clientAvatarBg: 'bg-teal-600 text-white',
    clientType: 'شركات',
    amount: 8750.00,
    date: '21 أكتوبر 2023',
    time: '03:10 م',
    paymentMethod: 'سداد',
    status: 'قيد الانتظار',
    statusType: 'pending',
    receiptNo: 'REC-9077',
  },
];

export const INITIAL_REPORTS_LIST: FinancialReportItem[] = [
  {
    id: 'rep-1',
    title: 'تقرير التحصيل الأسبوعي',
    createdDate: '15 أكتوبر 2023',
    type: 'مالي',
    typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'مكتمل',
    fileSize: '2.4 MB',
    format: 'PDF',
  },
  {
    id: 'rep-2',
    title: 'ملخص الديون المتعثرة',
    createdDate: '12 أكتوبر 2023',
    type: 'ديون',
    typeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    status: 'مكتمل',
    fileSize: '1.8 MB',
    format: 'PDF',
  },
  {
    id: 'rep-3',
    title: 'تحليل قاعدة العملاء',
    createdDate: '10 أكتوبر 2023',
    type: 'عملاء',
    typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'مكتمل',
    fileSize: '3.1 MB',
    format: 'PDF',
  },
  {
    id: 'rep-4',
    title: 'التقرير المالي الشهري - سبتمبر',
    createdDate: '01 أكتوبر 2023',
    type: 'مالي',
    typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'مكتمل',
    fileSize: '4.5 MB',
    format: 'PDF',
  },
  {
    id: 'rep-5',
    title: 'تقرير أداء بوابات الدفع وسداد',
    createdDate: '28 سبتمبر 2023',
    type: 'مالي',
    typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'مكتمل',
    fileSize: '1.2 MB',
    format: 'PDF',
  },
];
