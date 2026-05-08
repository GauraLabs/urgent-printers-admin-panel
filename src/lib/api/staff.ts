/**
 * Staff & Activity Log — wired to the FastAPI admin endpoints.
 * IDs come from the backend as numbers; we normalize to strings at the
 * boundary so the rest of the frontend treats all IDs uniformly.
 */

import type { AdminUser, ActivityLog } from '@/types';
import type { StaffListResponse, ActivityLogListResponse, CreateStaffRequest, UpdateStaffRequest } from '@/types/staff';
import { get, post, patch, del } from './client';

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeUser(raw: AdminUser & { id: string | number }): AdminUser {
  return { ...raw, id: String(raw.id) };
}

function normalizeActivity(raw: Omit<ActivityLog, 'id' | 'actor_admin_id' | 'resource_id'> & {
  id: string | number;
  actor_admin_id: string | number;
  resource_id: string | number | null;
}): ActivityLog {
  return {
    ...raw,
    id: String(raw.id),
    actor_admin_id: String(raw.actor_admin_id),
    resource_id: raw.resource_id != null ? String(raw.resource_id) : null,
  };
}

// ─── Staff ────────────────────────────────────────────────────────────────────
interface GetStaffParams {
  include_inactive?: boolean;
  offset?: number;
  limit?: number;
}

export async function getStaff(params: GetStaffParams = {}): Promise<StaffListResponse> {
  const res = await get<{
    items: (AdminUser & { id: string | number })[];
    total: number;
    offset: number;
    limit: number;
  }>('/admin/staff', {
    include_inactive: params.include_inactive ?? false,
    offset: params.offset ?? 0,
    limit: params.limit ?? 50,
  });
  return { ...res, items: res.items.map(normalizeUser) };
}

export async function getStaffMember(id: string): Promise<AdminUser> {
  const user = await get<AdminUser & { id: string | number }>(`/admin/staff/${id}`);
  return normalizeUser(user);
}

export async function createStaffMember(data: CreateStaffRequest): Promise<AdminUser> {
  const user = await post<AdminUser & { id: string | number }>('/admin/staff', data);
  return normalizeUser(user);
}

export async function updateStaffMember(id: string, data: UpdateStaffRequest & { password?: string }): Promise<AdminUser> {
  const user = await patch<AdminUser & { id: string | number }>(`/admin/staff/${id}`, data);
  return normalizeUser(user);
}

/**
 * Soft delete — sets is_active = false. Returns the updated user object so
 * the cache can be patched in place rather than refetched.
 * Backend returns 403 if the actor tries to deactivate themselves.
 */
export async function deleteStaffMember(id: string): Promise<AdminUser> {
  const user = await del<AdminUser & { id: string | number }>(`/admin/staff/${id}`);
  return normalizeUser(user);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
interface GetActivityParams {
  actor_admin_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  offset?: number;
  limit?: number;
}

export async function getActivityLog(params: GetActivityParams = {}): Promise<ActivityLogListResponse> {
  const res = await get<{
    items: Parameters<typeof normalizeActivity>[0][];
    total: number;
    offset: number;
    limit: number;
  }>('/admin/activity', {
    actor_admin_id: params.actor_admin_id || undefined,
    resource_type: params.resource_type || undefined,
    resource_id: params.resource_id || undefined,
    action: params.action || undefined,
    offset: params.offset ?? 0,
    limit: params.limit ?? 50,
  });
  return { ...res, items: res.items.map(normalizeActivity) };
}
