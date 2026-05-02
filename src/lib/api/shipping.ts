import type { Shipment, PaginatedResponse } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getShipments(filters: { status?: string; page?: number } = {}): Promise<PaginatedResponse<Shipment>> {
  await delay();
  const items: Shipment[] = Array.from({ length: 20 }, (_, i) => ({
    id: `ship-${i + 1}`,
    order_id: `ord-${2800 - i}`,
    order_number: `ORD-${2800 - i}`,
    customer_name: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar'][i % 3],
    courier: ['Shiprocket', 'Delhivery', 'Ekart'][i % 3],
    awb_number: `AWB${420000 + i}`,
    tracking_url: `https://shiprocket.co/track/${420000 + i}`,
    status: (['in_transit', 'delivered', 'out_for_delivery', 'created', 'picked_up'] as const)[i % 5],
    dispatched_at: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
    estimated_delivery: new Date(Date.now() + (3 - i % 4) * 1000 * 60 * 60 * 24).toISOString(),
    delivered_at: i % 5 === 1 ? new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() : null,
  }));
  return { items, total: 89, page: 1, page_size: 20, total_pages: 5 };
}

export async function checkServiceability(pincode: string) {
  await delay(300);
  return {
    pincode,
    is_serviceable: pincode.length === 6,
    couriers: [
      { name: 'Shiprocket', min_days: 3, max_days: 5, rate: 80 },
      { name: 'Delhivery', min_days: 4, max_days: 6, rate: 70 },
    ],
  };
}

export async function createShipment(order_id: string, courier: string): Promise<{ success: boolean; awb: string }> {
  await delay();
  return { success: true, awb: `AWB${Math.floor(Math.random() * 999999)}` };
}
