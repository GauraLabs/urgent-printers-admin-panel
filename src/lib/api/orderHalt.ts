import { get, put } from './client';
import type { OrderHaltSetting } from '@/types';

type RawOrderHaltSetting = Omit<OrderHaltSetting, 'id' | 'updated_by_admin_id'> & {
  id: number | string;
  updated_by_admin_id: number | string | null;
};

function normalizeOrderHalt(raw: RawOrderHaltSetting): OrderHaltSetting {
  return {
    ...raw,
    id: String(raw.id),
    updated_by_admin_id: raw.updated_by_admin_id === null ? null : String(raw.updated_by_admin_id),
  };
}

export interface UpdateOrderHaltPayload {
  is_halted: boolean;
  customer_message?: string | null;
  internal_reason?: string | null;
}

export async function getOrderHalt(): Promise<OrderHaltSetting | null> {
  const raw = await get<RawOrderHaltSetting | null>('/admin/settings/order-halt');
  return raw ? normalizeOrderHalt(raw) : null;
}

export async function updateOrderHalt(payload: UpdateOrderHaltPayload): Promise<OrderHaltSetting> {
  const raw = await put<RawOrderHaltSetting>('/admin/settings/order-halt', payload);
  return normalizeOrderHalt(raw);
}
