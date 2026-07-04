import { addDays, format } from 'date-fns';
import { getOrders, getOrder, updateOrderStatus } from './orders';
import type { ArtworkStatus } from '@/types';

export type QueueStatus = 'artwork_pending' | 'artwork_approved' | 'printing' | 'ready_to_dispatch';

// The three tabs with a real backing OrderStatus. `ready_to_dispatch` has no
// server-side status (OrderStatus goes straight from `printing` to `shipped`),
// so it can't be sourced from GET /admin/orders?status=.
const REAL_QUEUE_STATUSES: Exclude<QueueStatus, 'ready_to_dispatch'>[] = [
  'artwork_pending',
  'artwork_approved',
  'printing',
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

// ── "Ready to Dispatch" mock bucket ─────────────────────────────────────────
// No backend status exists for this tab, so it stays mock data until the
// backend adds one. Kept isolated from the real fetch above so it's obvious
// in the diff which part of the queue is fake.
const CUSTOMERS = ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Vikram Rao'];
const PRODUCTS = ['Business Cards Premium', 'Flyers A5 Gloss', 'Brochures A4 Trifold', 'Banners 4×2 ft', 'Stickers Round 50mm'];
const CONFIGS = ['90×54mm · 350 GSM · Matte · DS', 'A5 · 130 GSM Gloss · Single', 'A4 · 170 GSM · Tri-fold · DS', '4×2 ft · Flex · Eyelets', '⌀50mm · PP · Waterproof'];
const PINCODES = ['560034', '400001', '110001', '500032', '600001'];
const TURNAROUNDS = ['Rush', 'Express', 'Standard'];

function buildMockReadyToDispatch(): PrintingQueueItem[] {
  const items: PrintingQueueItem[] = [];
  for (let idx = 0; idx < 5; idx++) {
    const turnaround = TURNAROUNDS[idx % TURNAROUNDS.length];
    const dispatchDays = turnaround === 'Rush' ? 1 : turnaround === 'Express' ? 3 : 5;
    items.push({
      id: `qi-mock-${idx}`,
      order_id: `ord-mock-${3100 - idx}`,
      order_number: `ORD-${3100 - idx}`,
      customer_name: CUSTOMERS[idx % CUSTOMERS.length],
      customer_email: `${CUSTOMERS[idx % CUSTOMERS.length].toLowerCase().replace(' ', '.')}@example.com`,
      product_name: PRODUCTS[idx % PRODUCTS.length],
      config_summary: CONFIGS[idx % CONFIGS.length],
      quantity: [100, 250, 500, 1000][idx % 4],
      turnaround,
      status: 'ready_to_dispatch',
      artwork_status: 'approved',
      artwork_file_url: null,
      order_date: new Date(Date.now() - idx * 1000 * 60 * 60 * 8).toISOString(),
      estimated_dispatch: format(addDays(new Date(), dispatchDays), 'yyyy-MM-dd'),
      shipping_pincode: PINCODES[idx % PINCODES.length],
      awb_number: idx % 3 === 0 ? `AWB${420000 + idx}` : null,
    });
  }
  return items;
}

let _mockReadyToDispatch: PrintingQueueItem[] | null = null;

export async function getPrintingQueueAll(): Promise<PrintingQueueItem[]> {
  const realItems = await fetchRealQueueItems();
  if (!_mockReadyToDispatch) _mockReadyToDispatch = buildMockReadyToDispatch();
  return [...realItems, ..._mockReadyToDispatch];
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
  // OrderStatus has no `ready_to_dispatch` value — printing's only forward
  // transition is straight to `shipped`, which needs courier/AWB data this
  // panel doesn't collect (see getServiceabilityBulk/createShipmentsBulk below).
  await delay();
  return { success: true };
}

export interface CourierOption {
  name: string;
  min_days: number;
  max_days: number;
  rate: number;
}

export async function getServiceabilityBulk(
  orderIds: string[]
): Promise<{ order_id: string; couriers: CourierOption[] }[]> {
  // No courier/serviceability provider is wired up on the backend yet.
  await delay();
  return orderIds.map((order_id) => ({
    order_id,
    couriers: [
      { name: 'Shiprocket', min_days: 3, max_days: 5, rate: 80 },
      { name: 'Delhivery', min_days: 4, max_days: 6, rate: 70 },
      { name: 'Ekart', min_days: 5, max_days: 7, rate: 55 },
    ],
  }));
}

export async function createShipmentsBulk(
  orders: { order_id: string; courier: string }[]
): Promise<{ success: boolean; created: number }> {
  // No bulk shipment/AWB-creation endpoint exists on the backend yet.
  await delay(600);
  return { success: true, created: orders.length };
}
