import { getOrders, getOrder, updateOrderStatus } from './orders';
import {
  getServiceabilityBulk as getShipmentServiceabilityBulk,
  createShipmentsBulk as createShipmentsBulkReal,
  type CourierOption,
  type BulkShipmentResult,
} from './shipping';
import type { ArtworkStatus } from '@/types';

export type { CourierOption };
export type QueueStatus = 'artwork_pending' | 'artwork_approved' | 'printing' | 'ready_to_dispatch';

const REAL_QUEUE_STATUSES: QueueStatus[] = [
  'artwork_pending',
  'artwork_approved',
  'printing',
  'ready_to_dispatch',
];

export interface PrintingQueueItem {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  config_summary: string;
  quantity: number;
  turnaround: string | null;
  status: QueueStatus;
  artwork_status: ArtworkStatus;
  artwork_file_url: string | null;
  order_date: string;
  estimated_dispatch: string;
  shipping_pincode: string;
  awb_number: string | null;
}

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

function configSummary(item: {
  size_label: string | null;
  paper_label: string | null;
  finish_label: string | null;
  sides: string | null;
}): string {
  return [item.size_label, item.paper_label, item.finish_label, item.sides]
    .filter((v): v is string => Boolean(v))
    .join(' · ');
}

async function fetchRealQueueItems(): Promise<PrintingQueueItem[]> {
  const lists = await Promise.all(
    REAL_QUEUE_STATUSES.map((status) => getOrders({ status, page_size: 100 }))
  );
  const summaries = lists.flatMap((l) => l.items);
  const details = await Promise.all(summaries.map((o) => getOrder(o.id)));

  return details.flatMap((order) =>
    order.items.map((item) => ({
      id: item.id,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_name: item.product_name,
      config_summary: configSummary(item),
      quantity: item.quantity,
      turnaround: item.turnaround_label,
      // Safe: order was fetched by filtering on one of REAL_QUEUE_STATUSES.
      status: order.status as QueueStatus,
      artwork_status: item.artwork_status,
      // No public URL for artwork_file_key is exposed to the admin panel
      // (R2 base URL is server-side only) — same as OrderItems.tsx on the
      // Orders screen, which shows the filename with no download link.
      artwork_file_url: null,
      order_date: order.created_at,
      estimated_dispatch: order.shipping.estimated_delivery ?? '',
      shipping_pincode: order.shipping_address.pincode,
      awb_number: order.shipping.tracking_number,
    }))
  );
}

export async function getPrintingQueueAll(): Promise<PrintingQueueItem[]> {
  return fetchRealQueueItems();
}

export async function approveArtwork(orderId: string): Promise<{ success: boolean }> {
  // No admin endpoint exists for this. order.status only moves
  // artwork_pending -> artwork_approved via proof_approval_service.resolve_approval,
  // which today is only reachable from the customer's token link
  // (routes/public/proof_approval.py) or the WhatsApp button webhook.
  // resolve_approval()'s `source` param already has an unused "staff_override"
  // literal — the service supports this, only the admin route is missing.
  await delay();
  return { success: true };
}

export async function requestReupload(orderId: string, reason: string): Promise<{ success: boolean }> {
  // Same gap as approveArtwork: rejecting a proof is the other branch of
  // resolve_approval(), equally unreachable from any admin route today.
  await delay();
  return { success: true };
}

export async function startPrinting(orderId: string): Promise<{ success: boolean }> {
  return updateOrderStatus(orderId, 'printing');
}

export async function markReadyToDispatch(orderId: string): Promise<{ success: boolean }> {
  return updateOrderStatus(orderId, 'ready_to_dispatch');
}

export async function getServiceabilityBulk(orderIds: string[]) {
  return getShipmentServiceabilityBulk(orderIds);
}

export async function createShipmentsBulk(
  orders: { order_id: string; courier: string }[]
): Promise<BulkShipmentResult[]> {
  return createShipmentsBulkReal(orders);
}
