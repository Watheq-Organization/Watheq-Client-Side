export type NotificationCategory = 'payment' | 'debt' | 'customer' | 'report' | 'general';

export interface NotificationDto {
  id: number | string;
  title?: string;
  message?: string;
  body?: string;
  content?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  createdDate?: string;
  date?: string;
  type?: string | number;
  notificationType?: string | number;
  link?: string;
  url?: string;
  customerId?: number | string;
  debtId?: number | string;
  paymentId?: number | string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  rawDate: string;
  isRead: boolean;
  type: NotificationCategory;
  link?: string;
}
