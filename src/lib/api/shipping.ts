import { get, post } from './client';
import type { PaginatedResponse, Shipment, ShipmentStatus } from '@/types';

export interface CourierOption {
  courier_id: string;
  name: string;
  min_days: number;
  max_days: number;
  rate: number;
  cod_available: boolean;
}

export interface ServiceabilityResult {
  pincode: string;
  is_serviceable: boolean;
  couriers: CourierOption[];
}

export interface BulkServiceabilityResult {
  order_id: string;
  couriers: CourierOption[];
  error: string | null;
}

export interface CreateShipmentResult {
  success: boolean;
  awb_number: string | null;
  courier: string | null;
  tracking_url: string | null;
}

export interface BulkShipmentResult {
  order_id: string;
  success: boolean;
  awb_number: string | null;
  error: string | null;
}

// Shiprocket rates arrive in paise; every other price field in this app is
// already rupee-scale by the time it reaches formatPrice(), so convert here.
function normaliseCourier(raw: Record<string, unknown>): CourierOption {
  return {
    courier_id: String(raw.courier_id),
    name: raw.name as string,
    min_days: Number(raw.min_days),
    max_days: Number(raw.max_days),
    rate: Number(raw.rate ?? 0) / 100,
    cod_available: Boolean(raw.cod_available),
  };
}

function normaliseShipment(raw: Record<string, unknown>): Shipment {
  return {
    order_id: String(raw.order_id),
    order_number: raw.order_number as string,
    customer_name: (raw.customer_name as string | null) ?? null,
    courier: (raw.courier as string | null) ?? null,
    tracking_number: (raw.tracking_number as string | null) ?? null,
    tracking_url: (raw.tracking_url as string | null) ?? null,
    shipment_status: (raw.shipment_status as ShipmentStatus | null) ?? null,
    dispatched_at: (raw.dispatched_at as string | null) ?? null,
    estimated_delivery_date: (raw.estimated_delivery_date as string | null) ?? null,
    delivered_at: (raw.delivered_at as string | null) ?? null,
  };
}

export async function getShipments(
  filters: { status?: string; page?: number; page_size?: number } = {}
): Promise<PaginatedResponse<Shipment>> {
  const params: Record<string, string | number | undefined> = {
    status: filters.status,
    page: filters.page,
    page_size: filters.page_size,
  };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
  const raw = await get<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('/admin/shipments', params);
  return {
    items: raw.items.map(normaliseShipment),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
  };
}

export async function checkServiceability(
  pincode: string,
  weight_kg?: number,
  cod?: boolean
): Promise<ServiceabilityResult> {
  const raw = await post<{ pincode: string; is_serviceable: boolean; couriers: Record<string, unknown>[] }>(
    '/admin/shipping/serviceability',
    {
      pincode,
      ...(weight_kg !== undefined ? { weight_kg } : {}),
      ...(cod !== undefined ? { cod } : {}),
    }
  );
  return {
    pincode: raw.pincode,
    is_serviceable: raw.is_serviceable,
    couriers: raw.couriers.map(normaliseCourier),
  };
}

export async function getServiceabilityBulk(orderIds: string[]): Promise<BulkServiceabilityResult[]> {
  const raw = await post<Record<string, unknown>[]>('/admin/shipping/serviceability/bulk', {
    order_ids: orderIds.map((id) => Number(id)),
  });
  return raw.map((r) => ({
    order_id: String(r.order_id),
    couriers: ((r.couriers as Record<string, unknown>[]) ?? []).map(normaliseCourier),
    error: (r.error as string | null) ?? null,
  }));
}

export async function createShipment(order_id: string, courier: string): Promise<CreateShipmentResult> {
  const raw = await post<{
    success: boolean;
    awb_number?: string | null;
    courier?: string | null;
    tracking_url?: string | null;
  }>(`/admin/orders/${order_id}/shipment`, { courier });
  return {
    success: raw.success,
    awb_number: raw.awb_number ?? null,
    courier: raw.courier ?? null,
    tracking_url: raw.tracking_url ?? null,
  };
}

export async function createShipmentsBulk(
  orders: { order_id: string; courier: string }[]
): Promise<BulkShipmentResult[]> {
  const raw = await post<Record<string, unknown>[]>('/admin/shipments/bulk', {
    orders: orders.map((o) => ({ order_id: Number(o.order_id), courier: o.courier })),
  });
  return raw.map((r) => ({
    order_id: String(r.order_id),
    success: Boolean(r.success),
    awb_number: (r.awb_number as string | null) ?? null,
    error: (r.error as string | null) ?? null,
  }));
}
