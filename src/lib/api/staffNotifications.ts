/**
 * Staff notification preferences — per (admin_user, event_type, channel) opt-in matrix.
 * Wired to GET/PUT /admin/staff-notifications/preferences (staff.manage), phases 1-3
 * of the staff notification framework in the backend.
 */

import { get, put } from './client';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp';

export type NotificationEventType = 'order.created' | 'order.status_changed';

export interface StaffNotificationPreferenceItem {
  admin_user_id: string;
  name: string;
  email: string;
  phone_number: string | null;
  has_phone_number: boolean;
  preferences: Record<NotificationChannel, boolean>;
}

export interface StaffNotificationPreferencesResponse {
  items: StaffNotificationPreferenceItem[];
  total: number;
  event_type: NotificationEventType;
}

interface RawStaffNotificationPreferenceItem
  extends Omit<StaffNotificationPreferenceItem, 'admin_user_id'> {
  admin_user_id: string | number;
}

function normalizeItem(raw: RawStaffNotificationPreferenceItem): StaffNotificationPreferenceItem {
  return { ...raw, admin_user_id: String(raw.admin_user_id) };
}

export async function getStaffNotificationPreferences(
  eventType: NotificationEventType,
  includeInactive = false
): Promise<StaffNotificationPreferencesResponse> {
  const res = await get<{
    items: RawStaffNotificationPreferenceItem[];
    total: number;
    event_type: NotificationEventType;
  }>('/admin/staff-notifications/preferences', {
    event_type: eventType,
    include_inactive: includeInactive,
  });
  return { ...res, items: res.items.map(normalizeItem) };
}

export interface UpsertStaffNotificationPreferenceRequest {
  admin_user_id: string;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface StaffNotificationPreferenceResponse {
  id: string;
  admin_user_id: string;
  event_type: string;
  channel: NotificationChannel;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export async function upsertStaffNotificationPreference(
  req: UpsertStaffNotificationPreferenceRequest
): Promise<StaffNotificationPreferenceResponse> {
  const res = await put<
    Omit<StaffNotificationPreferenceResponse, 'id' | 'admin_user_id'> & {
      id: string | number;
      admin_user_id: string | number;
    }
  >('/admin/staff-notifications/preferences', {
    admin_user_id: Number(req.admin_user_id),
    event_type: req.event_type,
    channel: req.channel,
    enabled: req.enabled,
  });
  return { ...res, id: String(res.id), admin_user_id: String(res.admin_user_id) };
}
