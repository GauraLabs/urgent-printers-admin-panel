/**
 * Per-admin notification feed (bell icon) — wired to GET/POST
 * /admin/notifications, distinct from the dashboard's `stats.alerts`
 * (operational alerts derived from live order data, see dashboard.ts).
 */

import { get, post } from './client';
import type { PaginatedResponse } from '@/types';

export interface AdminNotification {
  id: string;
  admin_user_id: string;
  event_type: string;
  title: string;
  body: string;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string | null;
}

interface RawAdminNotification extends Omit<AdminNotification, 'id' | 'admin_user_id'> {
  id: number | string;
  admin_user_id: number | string;
}

function normalise(raw: RawAdminNotification): AdminNotification {
  return { ...raw, id: String(raw.id), admin_user_id: String(raw.admin_user_id) };
}

export interface GetAdminNotificationsParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
}

export async function getAdminNotifications(
  params: GetAdminNotificationsParams = {}
): Promise<PaginatedResponse<AdminNotification>> {
  const res = await get<PaginatedResponse<RawAdminNotification>>('/admin/notifications', {
    page: params.page,
    page_size: params.page_size,
    unread_only: params.unread_only,
  });
  return { ...res, items: res.items.map(normalise) };
}

export async function markNotificationRead(id: string): Promise<AdminNotification> {
  const res = await post<RawAdminNotification>(`/admin/notifications/${id}/read`);
  return normalise(res);
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return post<{ updated: number }>('/admin/notifications/read-all');
}
