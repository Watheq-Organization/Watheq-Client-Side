import { httpClient } from '../api/httpClient';
import type { AppNotification, NotificationCategory } from '../types/notification';
import { formatRelativeTime } from '../lib/dateUtils';

/**
 * Normalizes notification type to one of the friendly categories.
 */
function normalizeCategory(type: unknown, title = '', message = ''): NotificationCategory {
  const combined = `${String(type ?? '')} ${title} ${message}`.toLowerCase();
  if (combined.includes('pay') || combined.includes('دفع') || combined.includes('سداد') || combined.includes('تحصيل')) {
    return 'payment';
  }
  if (combined.includes('debt') || combined.includes('دين') || combined.includes('استحقاق')) {
    return 'debt';
  }
  if (combined.includes('custom') || combined.includes('عميل')) {
    return 'customer';
  }
  if (combined.includes('report') || combined.includes('تقرير')) {
    return 'report';
  }
  return 'general';
}

function normalizeNotificationDto(rawDto: unknown, index = 0): AppNotification {
  const dto = (rawDto && typeof rawDto === 'object' ? rawDto : {}) as Record<string, unknown>;
  const id = dto.id != null ? String(dto.id) : dto.Id != null ? String(dto.Id) : `notif-${index}-${Date.now()}`;
  const title = String(dto.title ?? dto.Title ?? 'إشعار جديد').trim();
  const message = String(
    dto.message ?? dto.Message ?? dto.body ?? dto.Body ?? dto.content ?? dto.Content ?? dto.description ?? dto.Description ?? ''
  ).trim();
  const rawDate = String(
    dto.createdAt ?? dto.CreatedAt ?? dto.createdDate ?? dto.CreatedDate ?? dto.date ?? dto.Date ?? new Date().toISOString()
  );
  const isRead = Boolean(dto.isRead ?? dto.IsRead ?? dto.read ?? dto.Read ?? false);
  const rawType = dto.type ?? dto.Type ?? dto.notificationType ?? dto.NotificationType;
  const type = normalizeCategory(rawType, title, message);

  return {
    id,
    title,
    message,
    time: formatRelativeTime(rawDate),
    rawDate,
    isRead,
    type,
    link: (dto.link ?? dto.Link ?? dto.url ?? dto.Url) ? String(dto.link ?? dto.Link ?? dto.url ?? dto.Url) : undefined,
  };
}

function extractNotificationList(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.result)) return obj.result;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.Items)) return obj.Items;
    if (Array.isArray(obj.notifications)) return obj.notifications;
    if (Array.isArray(obj.Notifications)) return obj.Notifications;
    if (Array.isArray(obj.value)) return obj.value;
    if (obj.data && typeof obj.data === 'object') {
      const d = obj.data as Record<string, unknown>;
      if (Array.isArray(d.items)) return d.items;
      if (Array.isArray(d.notifications)) return d.notifications;
    }
    if (obj.result && typeof obj.result === 'object') {
      const r = obj.result as Record<string, unknown>;
      if (Array.isArray(r.items)) return r.items;
      if (Array.isArray(r.notifications)) return r.notifications;
    }
  }
  return [];
}

/**
 * GET /api/Notification
 * Fetches the notifications list for the current merchant with optional filter and pagination.
 */
export async function getNotifications(params?: {
  isRead?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<AppNotification[]> {
  try {
    const queryParts: string[] = [];
    if (params?.isRead !== undefined) {
      queryParts.push(`isRead=${params.isRead}`);
    }
    if (params?.pageNumber) {
      queryParts.push(`pageNumber=${params.pageNumber}`);
    }
    if (params?.pageSize) {
      queryParts.push(`pageSize=${params.pageSize}`);
    } else {
      queryParts.push(`pageSize=20`);
    }

    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const raw = await httpClient.get<unknown>(`/Notification${qs}`);
    // eslint-disable-next-line no-console
    console.log('[getNotifications] Response from /Notification:', raw);
    const list = extractNotificationList(raw);
    return list.map((item, idx) => normalizeNotificationDto(item, idx));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[getNotifications] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * GET /api/Notification/unread-count
 * Fetches the number of unread notifications for the current merchant.
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const response = await httpClient.get<unknown>('/Notification/unread-count');
    // eslint-disable-next-line no-console
    console.log('[getUnreadNotificationsCount] Response:', response);
    if (typeof response === 'number') return response;
    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (typeof obj.count === 'number') return obj.count;
      if (typeof obj.Count === 'number') return obj.Count;
      if (obj.data && typeof obj.data === 'object') {
        const d = obj.data as Record<string, unknown>;
        if (typeof d.count === 'number') return d.count;
        if (typeof d.Count === 'number') return d.Count;
      }
      if (typeof obj.unreadCount === 'number') return obj.unreadCount;
      if (typeof obj.UnreadCount === 'number') return obj.UnreadCount;
      if (typeof obj.data === 'number') return obj.data;
      if (typeof obj.result === 'number') return obj.result;
    }
    return 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[getUnreadNotificationsCount] Error:', error);
    return 0;
  }
}

/**
 * PATCH /api/Notification/{id}/read
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(id: string | number): Promise<void> {
  try {
    await httpClient.patch<unknown>(`/Notification/${encodeURIComponent(id)}/read`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[markNotificationAsRead] PATCH error:', error);
    throw error;
  }
}

/**
 * PATCH /api/Notification/read-all
 * Marks all notifications as read for the current merchant.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await httpClient.patch<unknown>('/Notification/read-all');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[markAllNotificationsAsRead] PATCH error:', error);
    throw error;
  }
}
