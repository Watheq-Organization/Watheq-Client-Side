import { httpClient, ApiError } from '../api/httpClient';
import type {
  CollectionsReportParams,
  CollectionsReportResponse,
  CollectionItem,
  OverdueDebtsReportParams,
  OverdueDebtsReportResponse,
  OverdueDebtReportItem,
  OverdueDebtSummaryItem,
  OverdueDebtChartPoint,
  OverdueDebtsReportDetails,
  CustomerPerformanceParams,
  CustomerPerformanceReportResponse,
  CustomerPerformanceItem,
} from '../types/report';

/**
 * Builds URL query string from object properties.
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/**
 * GET https://whateq.runasp.net/api/Reports/collections
 * Fetches collections report with date range and pagination.
 * Sends safe default dates if not provided to prevent ASP.NET 400 Bad Request.
 */
import { getCustomerProfile } from './customerService';

export async function getCollectionsReport(
  params?: CollectionsReportParams
): Promise<CollectionsReportResponse> {
  // If fromDate / toDate are not provided, use wide safe range so ASP.NET required DateTime parameters never fail with 400
  const effectiveParams: CollectionsReportParams = {
    fromDate: params?.fromDate || '2020-01-01T00:00:00Z',
    toDate: params?.toDate || new Date(Date.now() + 86400000).toISOString(),
    pageNumber: params?.pageNumber || 1,
    pageSize: params?.pageSize || 20,
  };

  const qs = buildQueryString(effectiveParams as Record<string, unknown>);
  try {
    const raw = await httpClient.get<unknown>(`/Reports/collections${qs}`);
    console.log('[getCollectionsReport] Raw API response from /Reports/collections:', raw);
    const report = normalizeCollectionsReport(raw, effectiveParams);

    // Enrich items with true paymentMethod from customer profile transactions
    const uniqueCustomerIds = Array.from(
      new Set(report.items.map((i) => i.customerId).filter(Boolean))
    );

    if (uniqueCustomerIds.length > 0) {
      try {
        const profiles = await Promise.all(
          uniqueCustomerIds.map((cid) => getCustomerProfile(String(cid)).catch(() => null))
        );
        const txMap = new Map<string, string>();
        for (const p of profiles) {
          if (!p || !Array.isArray(p.transactions)) continue;
          for (const tx of p.transactions) {
            if (tx.paymentMethod) {
              if (tx.id) txMap.set(String(tx.id), tx.paymentMethod);
              if (tx.reference) txMap.set(String(tx.reference), tx.paymentMethod);
              txMap.set(`${p.id}_${tx.amount}`, tx.paymentMethod);
            }
          }
        }

        report.items = report.items.map((item) => {
          const matchedMethod =
            (item.paymentId ? txMap.get(String(item.paymentId)) : undefined) ??
            (item.receiptNumber ? txMap.get(String(item.receiptNumber)) : undefined) ??
            (item.customerId ? txMap.get(`${item.customerId}_${item.amount}`) : undefined);

          if (matchedMethod) {
            return {
              ...item,
              paymentMethod: formatPaymentMethod(matchedMethod),
            };
          }
          return item;
        });
      } catch (enrichErr) {
        console.warn('[getCollectionsReport] Could not enrich payment methods:', enrichErr);
      }
    }

    return report;
  } catch (error) {
    console.error('[getCollectionsReport] Server error:', error);
    throw error;
  }
}

/**
 * Formats payment method enum or string into friendly Arabic text.
 */
export function formatPaymentMethod(val: unknown): string {
  if (val === undefined || val === null || val === '') return 'نقداً';
  if (typeof val === 'number') {
    if (val === 1) return 'نقداً';
    if (val === 2) return 'تحويل بنكي';
    if (val === 3) return 'بطاقة / محفظة';
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    const inner = obj.name ?? obj.Name ?? obj.value ?? obj.id;
    if (inner !== undefined) return formatPaymentMethod(inner);
  }
  const s = String(val).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (s === '1' || s.includes('cash') || s.includes('نقد')) return 'نقداً';
  if (s === '2' || s.includes('bank') || s.includes('بنك') || s.includes('تحويل') || s.includes('transfer')) return 'تحويل بنكي';
  if (s === '3' || s.includes('card') || s.includes('credit') || s.includes('محفظ') || s.includes('مدى') || s.includes('بطاق')) return 'بطاقة / محفظة';
  return String(val);
}

/**
 * Prints or exports Collections Report to a formatted HTML print page.
 */
export function printCollectionsReportHtml(
  data: CollectionsReportResponse,
  dateRangeLabel = 'كافة الفترات'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة أو تصدير التقرير.');
    return;
  }

  const itemsRows = data.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-weight: bold;">${item.receiptNumber || item.id}</td>
      <td>${item.customerName}</td>
      <td style="text-align: left; font-weight: bold; color: #047857;">${item.amount.toLocaleString('ar-SA')} ش.إ</td>
      <td style="text-align: center;">${item.date}</td>
      <td style="text-align: center;">${formatPaymentMethod(item.paymentMethod)}</td>
      <td style="text-align: center;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${item.status || 'مكتمل'}</span></td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>تقرير التحصيلات المالية - وثيق</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Cairo', sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 12px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #051838; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 800; color: #051838; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: right; }
        .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; }
        .kpi-val { font-size: 18px; font-weight: 800; color: #051838; margin-top: 4px; }
        .kpi-val.emerald { color: #047857; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { background: #051838; color: #fff; padding: 8px 10px; text-align: right; font-weight: 700; border: 1px solid #051838; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 25px; padding-top: 15px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">تقرير التحصيلات المالية</h1>
          <p class="subtitle">نظام وثيق لإدارة الديون والتحصيلات | الفترة: ${dateRangeLabel}</p>
        </div>
        <div style="text-align: left;">
          <div style="font-weight: 800; font-size: 18px; color: #051838;">وثيق WATHEQ</div>
          <div style="font-size: 10px; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">إجمالي التحصيلات</div>
          <div class="kpi-val emerald">${data.totalCollected.toLocaleString('ar-SA')} ش.إ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">عدد عمليات التحصيل</div>
          <div class="kpi-val">${data.totalRecords.toLocaleString('ar-SA')} عملية</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">متوسط قيمة السند</div>
          <div class="kpi-val">${(data.totalRecords > 0 ? Math.round(data.totalCollected / data.totalRecords) : 0).toLocaleString('ar-SA')} ش.إ</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>رقم السند</th>
            <th>اسم العميل</th>
            <th>المبلغ المحصل</th>
            <th style="text-align: center;">تاريخ السداد</th>
            <th style="text-align: center;">طريقة الدفع</th>
            <th style="text-align: center;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="footer">
        <div>تم استخراج هذا التقرير آلياً عبر منصة وثيق المالية</div>
        <div>صفحة 1 من 1</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * GET https://whateq.runasp.net/api/reports/overdue-debts
 * Fetches overdue debts report with optional date range and pagination.
 * If fromDate & toDate are omitted, the backend defaults to the last 30 days.
 */
export async function getOverdueDebtsReport(
  params?: OverdueDebtsReportParams
): Promise<OverdueDebtsReportResponse> {
  // Validate fromDate <= toDate if both provided
  if (params?.fromDate && params?.toDate && params.fromDate > params.toDate) {
    throw new Error('تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.');
  }

  const queryParams: Record<string, unknown> = {};
  if (params?.fromDate) queryParams.fromDate = params.fromDate;
  if (params?.toDate) queryParams.toDate = params.toDate;
  if (params?.pageNumber) queryParams.pageNumber = params.pageNumber;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;

  const qs = buildQueryString(queryParams);
  const raw = await httpClient.get<unknown>(`/reports/overdue-debts${qs}`);
  return normalizeOverdueDebtsReport(raw, params);
}

/**
 * Exports overdue debts report data as CSV file.
 */
export function exportOverdueDebtsReportCsv(
  items: OverdueDebtReportItem[],
  filename = 'تقرير_الديون_المتأخرة.csv'
): void {
  const headers = [
    'رقم الدين',
    'اسم العميل',
    'المبلغ الأصلي',
    'المبلغ المتأخر',
    'العملة',
    'تاريخ الاستحقاق',
    'أيام التأخير',
    'الحالة',
  ];
  const rows = items.map((item) => [
    item.debtId,
    item.customerName,
    item.originalAmount,
    item.remainingAmount,
    item.currencyCode,
    item.dueDate ? item.dueDate.split('T')[0] : '—',
    item.daysOverdue,
    item.status === 'Overdue' ? 'متأخر' : item.status,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(',')]
      .concat(rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats and prints or exports Overdue Debts Report to A4 HTML document.
 */
export function printOverdueDebtsReportHtml(
  data: OverdueDebtsReportResponse,
  dateRangeLabel = 'آخر 30 يوماً'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة أو تصدير التقرير.');
    return;
  }

  const items = data.details?.items || [];
  const itemsRows = items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-weight: bold;">#${item.debtId}</td>
      <td>${item.customerName}</td>
      <td style="text-align: left;">${item.originalAmount.toLocaleString('ar-SA')} ${item.currencyCode}</td>
      <td style="text-align: left; font-weight: bold; color: #dc2626;">${item.remainingAmount.toLocaleString('ar-SA')} ${item.currencyCode}</td>
      <td style="text-align: center;">${item.dueDate ? item.dueDate.split('T')[0] : '—'}</td>
      <td style="text-align: center; color: #b91c1c; font-weight: bold;">${item.daysOverdue} يوم</td>
      <td style="text-align: center;"><span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px;">متأخر</span></td>
    </tr>
  `
    )
    .join('');

  const summaryCards = data.summary
    .map(
      (s) => `
    <div class="kpi-card">
      <div class="kpi-label">إجمالي المتأخرات (${s.currencyCode})</div>
      <div class="kpi-val red">${s.totalOverdueAmount.toLocaleString('ar-SA')} ${s.currencyCode}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${s.numberOfOverdueDebts} ديون متأخرة | ${s.numberOfCustomersWithOverdueDebts} عملاء</div>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>تقرير الديون المتأخرة - وثيق</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Cairo', sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 12px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 800; color: #051838; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: right; }
        .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; }
        .kpi-val { font-size: 18px; font-weight: 800; color: #051838; margin-top: 4px; }
        .kpi-val.red { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { background: #051838; color: #fff; padding: 8px 10px; text-align: right; font-weight: 700; border: 1px solid #051838; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 25px; padding-top: 15px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">تقرير الديون والذمم المتأخرة</h1>
          <p class="subtitle">نظام وثيق المالي | الفترة: ${dateRangeLabel}</p>
        </div>
        <div style="text-align: left;">
          <div style="font-weight: 800; font-size: 18px; color: #051838;">وثيق WATHEQ</div>
          <div style="font-size: 10px; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
      </div>

      <div class="kpi-grid">
        ${summaryCards || '<div class="kpi-card"><div class="kpi-label">الحالة</div><div class="kpi-val">لا توجد ديون متأخرة</div></div>'}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>رقم الدين</th>
            <th>اسم العميل</th>
            <th>المبلغ الأصلي</th>
            <th>المبلغ المتأخر</th>
            <th style="text-align: center;">تاريخ الاستحقاق</th>
            <th style="text-align: center;">التأخير</th>
            <th style="text-align: center;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد سجلات ديون متأخرة خلال هذه الفترة.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div>تم استخراج هذا التقرير آلياً عبر منصة وثيق المالية</div>
        <div>صفحة 1 من 1</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * GET https://whateq.runasp.net/api/Reports/customer-performance
 * Fetches customer commitment and payment performance report.
 */
export async function getCustomerPerformanceReport(
  params?: CustomerPerformanceParams
): Promise<CustomerPerformanceReportResponse> {
  const qs = buildQueryString(params as Record<string, unknown>);
  const raw = await httpClient.get<unknown>(`/Reports/customer-performance${qs}`);
  return normalizeCustomerPerformanceReport(raw);
}

/**
 * Exports collections report data as CSV file.
 */
export function exportCollectionsReportCsv(
  items: CollectionItem[],
  filename = 'تقرير_التحصيلات.csv'
): void {
  const headers = ['رقم العملية', 'اسم العميل', 'المبلغ (ش.إ)', 'تاريخ السداد', 'طريقة الدفع', 'رقم الإيصال', 'الحالة'];
  const rows = items.map((item) => [
    item.id,
    item.customerName,
    item.amount,
    item.date,
    item.paymentMethod || 'نقداً',
    item.receiptNumber || '—',
    item.status || 'مكتمل',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(',')]
      .concat(rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Maps API errors into friendly Arabic text.
 */
export function toReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة أو تعذر التحقق من تسجيل الدخول (401 Unauthorized). يرجى تسجيل الدخول مجدداً لتحميل بياناتك من الخادم.';
    }
    if (error.status === 404) {
      return 'لم يتم العثور على سجلات مطابقة في هذا النطاق الزمني.';
    }
    if (error.status === 400) {
      const body = error.body as { message?: string; errors?: Record<string, string[]> } | null;
      if (body?.message) return body.message;
      return 'طلب غير صالح، يرجى التأكد من صحة التواريخ والمعايير المحددة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ غير متوقع في خادم البيانات (HTTP 500)، يرجى المحاولة لاحقاً.';
    }
    const body = error.body as { message?: string } | null;
    if (body?.message) return body.message;
    return `حدث خطأ أثناء تحميل التقرير من الخادم (رمز الخطأ: ${error.status}).`;
  }
  return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت أو اتصال الشبكة.';
}

/**
 * Unwraps and normalizes various ASP.NET wrapper shapes for CollectionsReport.
 * Specifically supports the verified backend structure:
 * {
 *   hasData: boolean,
 *   message: string,
 *   summary: [{ currency, totalCollected, numberOfPayments, averagePayment }],
 *   chart: [{ label, amount, currency }],
 *   details: { items: [...], totalCount, pageNumber, pageSize }
 * }
 */
function normalizeCollectionsReport(
  raw: unknown,
  params?: CollectionsReportParams
): CollectionsReportResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      hasData: false,
      totalCollected: 0,
      totalRecords: 0,
      pageNumber: params?.pageNumber || 1,
      pageSize: params?.pageSize || 20,
      items: [],
      chart: [],
      summary: [],
    };
  }

  const obj = unwrapResponseData(raw);

  // If array returned directly
  if (Array.isArray(obj)) {
    const items = obj.map(mapToCollectionItem);
    const totalCollected = items.reduce((sum, i) => sum + i.amount, 0);
    return {
      hasData: items.length > 0,
      totalCollected,
      totalRecords: items.length,
      pageNumber: params?.pageNumber || 1,
      pageSize: params?.pageSize || 20,
      items,
      chart: [],
      summary: [],
    };
  }

  const record = (obj || {}) as Record<string, unknown>;

  // Check nested details.items (ASP.NET CollectionsReport verified schema)
  const detailsObj = (record.details ?? record.Details) as Record<string, unknown> | undefined;
  let rawItems: unknown[] = [];

  if (detailsObj && typeof detailsObj === 'object') {
    if (Array.isArray(detailsObj.items)) {
      rawItems = detailsObj.items;
    } else if (Array.isArray(detailsObj.Items)) {
      rawItems = detailsObj.Items;
    }
  }

  // Fallback to top-level arrays if details.items wasn't present
  if (rawItems.length === 0) {
    const possibleArrays = [
      record.items,
      record.Items,
      record.collections,
      record.Collections,
      record.data,
      record.Data,
      record.result,
      record.Result,
      record.payments,
      record.Payments,
    ];
    const foundArray = possibleArrays.find((arr) => Array.isArray(arr));
    rawItems = Array.isArray(foundArray) ? (foundArray as unknown[]) : [];
  }

  const items = rawItems.map(mapToCollectionItem);

  // Extract Summary KPIs
  const rawSummary = Array.isArray(record.summary)
    ? record.summary
    : Array.isArray(record.Summary)
      ? record.Summary
      : [];

  const summary = rawSummary.map((s: any) => ({
    currency: String(s.currency || s.Currency || 'ILS'),
    totalCollected: Number(s.totalCollected ?? s.TotalCollected ?? 0),
    numberOfPayments: Number(s.numberOfPayments ?? s.NumberOfPayments ?? 0),
    averagePayment: Number(s.averagePayment ?? s.AveragePayment ?? 0),
  }));

  // Extract Chart
  const rawChart = Array.isArray(record.chart)
    ? record.chart
    : Array.isArray(record.Chart)
      ? record.Chart
      : [];

  const chart = rawChart.map((c: any) => ({
    label: String(c.label || c.Label || ''),
    amount: Number(c.amount ?? c.Amount ?? 0),
    currency: c.currency || c.Currency,
  }));

  // Total collected calculation
  const summaryCollected = summary.length > 0 ? summary.reduce((sum: number, s: any) => sum + s.totalCollected, 0) : 0;
  const totalCollected =
    summaryCollected > 0
      ? summaryCollected
      : typeof (record.totalCollected ?? record.TotalCollected) === 'number'
        ? Number(record.totalCollected ?? record.TotalCollected)
        : typeof (record.totalAmount ?? record.TotalAmount) === 'number'
          ? Number(record.totalAmount ?? record.TotalAmount)
          : typeof (record.collectedAmount ?? record.CollectedAmount) === 'number'
            ? Number(record.collectedAmount ?? record.CollectedAmount)
            : items.reduce((sum, i) => sum + i.amount, 0);

  // Total records calculation
  const detailsTotalCount = detailsObj ? Number(detailsObj.totalCount ?? detailsObj.TotalCount) : undefined;
  const totalRecords =
    typeof detailsTotalCount === 'number' && !isNaN(detailsTotalCount)
      ? detailsTotalCount
      : typeof (record.totalRecords ?? record.TotalRecords) === 'number'
        ? Number(record.totalRecords ?? record.TotalRecords)
        : typeof (record.totalCount ?? record.TotalCount) === 'number'
          ? Number(record.totalCount ?? record.TotalCount)
          : items.length;

  const pageNumber =
    Number(detailsObj?.pageNumber ?? detailsObj?.PageNumber ?? record.pageNumber ?? record.PageNumber) ||
    params?.pageNumber ||
    1;
  const pageSize =
    Number(detailsObj?.pageSize ?? detailsObj?.PageSize ?? record.pageSize ?? record.PageSize) ||
    params?.pageSize ||
    20;

  return {
    hasData: record.hasData !== undefined ? Boolean(record.hasData) : items.length > 0,
    message: typeof record.message === 'string' ? record.message : null,
    totalCollected,
    totalRecords,
    pageNumber,
    pageSize,
    summary,
    chart,
    items,
  };
}

function mapToCollectionItem(item: unknown): CollectionItem {
  if (!item || typeof item !== 'object') {
    return {
      id: Math.random().toString(),
      customerName: 'عميل',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    };
  }

  const r = item as Record<string, unknown>;
  const paymentIdVal = r.paymentId ?? r.PaymentId;
  const customerIdVal = r.customerId ?? r.CustomerId;
  const customerNameVal =
    r.customerName ??
    r.CustomerName ??
    r.customerFullName ??
    r.CustomerFullName ??
    r.fullName ??
    r.FullName ??
    r.name ??
    r.Name ??
    r.customer ??
    r.Customer ??
    'عميل';
  const amountVal =
    r.amount ??
    r.Amount ??
    r.paidAmount ??
    r.PaidAmount ??
    r.collectedAmount ??
    r.CollectedAmount ??
    r.paymentAmount ??
    r.PaymentAmount ??
    0;
  const dateVal =
    r.date ??
    r.Date ??
    r.paymentDate ??
    r.PaymentDate ??
    r.createdAt ??
    r.CreatedAt ??
    new Date().toISOString().split('T')[0];
  const receiptVal = r.receiptNumber ?? r.ReceiptNumber ?? r.receiptNo ?? r.ReceiptNo ?? r.id ?? r.Id;

  return {
    id: String(paymentIdVal ?? r.id ?? r.Id ?? receiptVal ?? Math.random().toString()),
    paymentId:
      typeof paymentIdVal === 'number'
        ? paymentIdVal
        : typeof paymentIdVal === 'string' && !isNaN(Number(paymentIdVal))
          ? Number(paymentIdVal)
          : undefined,
    customerId: customerIdVal !== undefined ? String(customerIdVal) : undefined,
    customerName: String(customerNameVal),
    amount: Number(amountVal) || 0,
    currency: String(r.currency || r.Currency || 'ILS'),
    date: String(dateVal).split('T')[0],
    paymentMethod: formatPaymentMethod(
      r.paymentMethod ??
      r.PaymentMethod ??
      r.paymentMethodName ??
      r.PaymentMethodName ??
      r.method ??
      r.Method ??
      r.paymentType ??
      r.PaymentType
    ),
    receiptNumber: receiptVal ? String(receiptVal) : paymentIdVal ? `REC-${paymentIdVal}` : undefined,
    status: (r.status ?? r.Status) ? String(r.status ?? r.Status) : 'مكتمل',
  };
}

function normalizeOverdueDebtsReport(
  raw: unknown,
  params?: OverdueDebtsReportParams
): OverdueDebtsReportResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      hasData: false,
      message: 'لا توجد بيانات كافية لعرض التقرير خلال الفترة المحددة.',
      summary: [],
      chart: [],
      details: null,
    };
  }

  const obj = unwrapResponseData(raw);
  if (!obj || typeof obj !== 'object') {
    return {
      hasData: false,
      message: 'لا توجد بيانات كافية لعرض التقرير خلال الفترة المحددة.',
      summary: [],
      chart: [],
      details: null,
    };
  }
  const record = obj as Record<string, unknown>;

  const hasData = record.hasData !== undefined ? Boolean(record.hasData) : false;
  const message = typeof record.message === 'string' ? record.message : null;

  // 1. Extract Summary (Grouped by Currency)
  const rawSummary = Array.isArray(record.summary)
    ? record.summary
    : Array.isArray(record.Summary)
      ? record.Summary
      : [];

  const summary: OverdueDebtSummaryItem[] = rawSummary.map((s: any) => ({
    currencyCode: String(s.currencyCode || s.CurrencyCode || 'ILS'),
    totalOverdueAmount: Number(s.totalOverdueAmount ?? s.TotalOverdueAmount ?? 0),
    numberOfOverdueDebts: Number(s.numberOfOverdueDebts ?? s.NumberOfOverdueDebts ?? 0),
    numberOfCustomersWithOverdueDebts: Number(
      s.numberOfCustomersWithOverdueDebts ?? s.NumberOfCustomersWithOverdueDebts ?? 0
    ),
  }));

  // 2. Extract Chart
  const rawChart = Array.isArray(record.chart)
    ? record.chart
    : Array.isArray(record.Chart)
      ? record.Chart
      : [];

  const chart: OverdueDebtChartPoint[] = rawChart.map((c: any) => ({
    label: String(c.label || c.Label || ''),
    amount: Number(c.amount ?? c.Amount ?? 0),
    currencyCode: String(c.currencyCode || c.CurrencyCode || 'ILS'),
  }));

  // 3. Extract Details & Items (with Pagination)
  const detailsRaw = (record.details ?? record.Details) as Record<string, unknown> | null;
  let details: OverdueDebtsReportDetails | null = null;

  if (detailsRaw && typeof detailsRaw === 'object') {
    const rawItems = Array.isArray(detailsRaw.items)
      ? detailsRaw.items
      : Array.isArray(detailsRaw.Items)
        ? detailsRaw.Items
        : [];

    const items: OverdueDebtReportItem[] = rawItems.map((r: any) => ({
      debtId: Number(r.debtId ?? r.DebtId ?? 0),
      customerId: String(r.customerId ?? r.CustomerId ?? ''),
      customerName: String(r.customerName || r.CustomerName || 'عميل'),
      originalAmount: Number(r.originalAmount ?? r.OriginalAmount ?? 0),
      remainingAmount: Number(r.remainingAmount ?? r.RemainingAmount ?? 0),
      currencyCode: String(r.currencyCode || r.CurrencyCode || 'ILS'),
      dueDate: String(r.dueDate || r.DueDate || ''),
      daysOverdue: Number(r.daysOverdue ?? r.DaysOverdue ?? 0),
      status: String(r.status || r.Status || 'Overdue'),
    }));

    const totalCount = Number(detailsRaw.totalCount ?? detailsRaw.TotalCount ?? items.length);
    const pageNumber = Number(detailsRaw.pageNumber ?? detailsRaw.PageNumber ?? params?.pageNumber ?? 1);
    const pageSize = Number(detailsRaw.pageSize ?? detailsRaw.PageSize ?? params?.pageSize ?? 20);

    details = {
      items,
      totalCount,
      pageNumber,
      pageSize,
    };
  }

  return {
    hasData: hasData || (details !== null && details.items.length > 0),
    message,
    summary,
    chart,
    details,
  };
}

function normalizeCustomerPerformanceReport(raw: unknown): CustomerPerformanceReportResponse {
  const obj = unwrapResponseData(raw);
  const list = Array.isArray(obj) ? obj : Array.isArray((obj as any)?.items) ? (obj as any).items : [];

  const items: CustomerPerformanceItem[] = list.map((r: any) => ({
    customerId: String(r.customerId || r.id),
    customerName: String(r.customerName || r.fullName || 'عميل'),
    totalDebts: Number(r.totalDebts || r.totalDebt || 0),
    totalPaid: Number(r.totalPaid || 0),
    commitmentRate: Number(r.commitmentRate || 100),
    lastPaymentDate: r.lastPaymentDate ? String(r.lastPaymentDate) : undefined,
  }));

  return {
    totalCustomers: items.length,
    items,
  };
}

function unwrapResponseData(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;

    // If wrapped in standard CommandResult envelope: { result: { code, message }, data: ... }
    if ('result' in r && ('data' in r || 'Data' in r)) {
      const dataVal = r.data !== undefined ? r.data : r.Data;
      if (dataVal === null || dataVal === undefined) {
        return null;
      }
      return unwrapResponseData(dataVal);
    }

    if (r.data !== undefined && r.data !== null) return unwrapResponseData(r.data);
    if (r.Data !== undefined && r.Data !== null) return unwrapResponseData(r.Data);

    // Only unwrap 'result' if it contains actual payload data (not just { code, message })
    if (r.result !== undefined && r.result !== null) {
      const res = r.result as Record<string, unknown>;
      if (
        typeof res === 'object' &&
        ('code' in res || 'message' in res) &&
        !('hasData' in res) &&
        !('items' in res) &&
        !('summary' in res) &&
        !('details' in res)
      ) {
        return null;
      }
      return unwrapResponseData(r.result);
    }
  }
  return raw;
}
