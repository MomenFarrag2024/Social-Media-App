import type { ApiEnvelope, AppNotification, Page } from '../types';
import { api } from './axiosInstance';
import { normalizeNotification, parseCount, parsePage } from './normalizers';

export const NOTIFICATIONS_PAGE_SIZE = 20;

export async function getNotifications(page: number, limit = NOTIFICATIONS_PAGE_SIZE): Promise<Page<AppNotification>> {
  const { data } = await api.get<ApiEnvelope>('/notifications', { params: { page, limit } });
  return parsePage(data, normalizeNotification, ['notifications', 'items'], page, limit);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiEnvelope>('/notifications/unread-count');
  return parseCount(data.data);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
