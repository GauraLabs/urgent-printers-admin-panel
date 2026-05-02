import type { ArtworkStatus, TurnaroundType } from '@/types';
import { addDays, format } from 'date-fns';

export type QueueStatus = 'artwork_pending' | 'artwork_approved' | 'printing' | 'ready_to_dispatch';

export interface PrintingQueueItem {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  config_summary: string;
  quantity: number;
  turnaround: TurnaroundType;
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

const CUSTOMERS = ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Vikram Rao', 'Neha Gupta', 'Arjun Mehta', 'Kavita Joshi'];
const PRODUCTS = ['Business Cards Premium', 'Flyers A5 Gloss', 'Brochures A4 Trifold', 'Banners 4×2 ft', 'Stickers Round 50mm'];
const CONFIGS = ['90×54mm · 350 GSM · Matte · DS', 'A5 · 130 GSM Gloss · Single', 'A4 · 170 GSM · Tri-fold · DS', '4×2 ft · Flex · Eyelets', '⌀50mm · PP · Waterproof'];
const PINCODES = ['560034', '400001', '110001', '500032', '600001'];

const STATUS_DISTRIBUTION: { status: QueueStatus; artwork: ArtworkStatus; count: number }[] = [
  { status: 'artwork_pending', artwork: 'pending', count: 8 },
  { status: 'artwork_pending', artwork: 'reupload_requested', count: 4 },
  { status: 'artwork_approved', artwork: 'approved', count: 10 },
  { status: 'printing', artwork: 'approved', count: 7 },
  { status: 'ready_to_dispatch', artwork: 'approved', count: 5 },
];

let _cache: PrintingQueueItem[] | null = null;

function buildMockData(): PrintingQueueItem[] {
  let idx = 0;
  const items: PrintingQueueItem[] = [];
  for (const { status, artwork, count } of STATUS_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      const turnarounds: TurnaroundType[] = ['rush', 'express', 'standard'];
      const turnaround = turnarounds[idx % 3];
      const dispatchDays = turnaround === 'rush' ? 1 : turnaround === 'express' ? 3 : 5;
      items.push({
        id: `qi-${idx}`,
        order_id: `ord-${3100 - idx}`,
        order_number: `ORD-${3100 - idx}`,
        customer_name: CUSTOMERS[idx % CUSTOMERS.length],
        customer_email: `${CUSTOMERS[idx % CUSTOMERS.length].toLowerCase().replace(' ', '.')}@example.com`,
        product_name: PRODUCTS[idx % PRODUCTS.length],
        config_summary: CONFIGS[idx % CONFIGS.length],
        quantity: [100, 250, 500, 1000][idx % 4],
        turnaround,
        status,
        artwork_status: artwork,
        artwork_file_url: artwork !== 'pending' ? `https://example.com/artwork-${idx}.pdf` : null,
        order_date: new Date(Date.now() - idx * 1000 * 60 * 60 * 8).toISOString(),
        estimated_dispatch: format(addDays(new Date(), dispatchDays - (idx % 2)), 'yyyy-MM-dd'),
        shipping_pincode: PINCODES[idx % PINCODES.length],
        awb_number: status === 'ready_to_dispatch' && idx % 3 === 0 ? `AWB${420000 + idx}` : null,
      });
      idx++;
    }
  }
  return items;
}

export async function getPrintingQueueAll(): Promise<PrintingQueueItem[]> {
  await delay();
  if (!_cache) _cache = buildMockData();
  return [..._cache];
}

export async function approveArtwork(orderId: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function requestReupload(orderId: string, reason: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function startPrinting(orderId: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function markReadyToDispatch(orderId: string): Promise<{ success: boolean }> {
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
  await delay(600);
  return { success: true, created: orders.length };
}
