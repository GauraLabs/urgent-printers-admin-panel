import type {
  Order,
  OrderWithDetails,
  OrdersListResponse,
  OrderFilters,
  OrderStatus,
} from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

const STATUSES: OrderStatus[] = [
  'placed', 'confirmed', 'artwork_pending', 'artwork_approved',
  'printing', 'shipped', 'delivered', 'cancelled', 'refund_initiated', 'refunded',
];

const CUSTOMERS = [
  { name: 'Rahul Sharma', email: 'rahul@example.com' },
  { name: 'Priya Singh', email: 'priya@example.com' },
  { name: 'Amit Kumar', email: 'amit@example.com' },
  { name: 'Sneha Patel', email: 'sneha@example.com' },
  { name: 'Vikram Rao', email: 'vikram@example.com' },
  { name: 'Neha Gupta', email: 'neha@example.com' },
  { name: 'Arjun Mehta', email: 'arjun@example.com' },
  { name: 'Kavita Joshi', email: 'kavita@example.com' },
];

function makeOrder(i: number): Order {
  const c = CUSTOMERS[i % CUSTOMERS.length];
  return {
    id: `ord-${3000 - i}`,
    order_number: `ORD-${3000 - i}`,
    status: STATUSES[i % STATUSES.length],
    customer_id: `cust-${i % 50}`,
    customer_name: c.name,
    customer_email: c.email,
    total_amount: Math.floor(2500 + (i * 1337) % 18000),
    currency: 'INR',
    coupon_code: i % 7 === 0 ? 'SAVE10' : null,
    discount_amount: i % 7 === 0 ? 200 : 0,
    subtotal: Math.floor(2500 + (i * 1337) % 18000),
    turnaround: (['standard', 'express', 'rush'] as const)[i % 3],
    created_at: new Date(Date.now() - i * 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - i * 1000 * 60 * 45).toISOString(),
  };
}

export async function getOrders(filters: OrderFilters = {}): Promise<OrdersListResponse> {
  await delay();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const total = 247;
  const items = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) =>
    makeOrder((page - 1) * pageSize + i)
  );
  return { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) };
}

export async function getOrder(id: string): Promise<OrderWithDetails> {
  await delay();
  const i = parseInt(id.replace('ord-', '') || '0') % 50;
  const base = makeOrder(i);
  return {
    ...base,
    customer_phone: '+91 98765 43210',
    customer_total_orders: 12,
    items: [
      {
        id: 'item-1',
        product_id: 'p1',
        product_name: 'Business Cards Premium',
        product_slug: 'business-cards-premium',
        size: '90mm x 54mm',
        paper_type: '350 GSM Art Board',
        finish: 'Matte Lamination',
        sides: 'Double Sided',
        quantity: 500,
        unit_price: 3,
        total_price: 1500,
        turnaround: 'express',
        artwork_status: 'approved',
        artwork_file_url: 'https://example.com/artwork.pdf',
        artwork_preview_url: null,
        artwork_notes: null,
        custom_notes: null,
      },
    ],
    payment: {
      method: 'UPI',
      provider: 'Razorpay',
      transaction_id: `rzp_${base.id}`,
      amount: base.total_amount,
      currency: 'INR',
      status: 'paid',
      paid_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    shipping_address: {
      name: base.customer_name,
      phone: '+91 98765 43210',
      line1: '42, MG Road',
      line2: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India',
    },
    billing_address: {
      name: base.customer_name,
      phone: '+91 98765 43210',
      line1: '42, MG Road',
      line2: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India',
    },
    shipping: {
      courier: base.status === 'shipped' ? 'Shiprocket' : null,
      awb_number: base.status === 'shipped' ? '42098374982' : null,
      tracking_url: base.status === 'shipped' ? 'https://shiprocket.co/track/42098374982' : null,
      estimated_delivery: null,
      dispatched_at: null,
      delivered_at: null,
    },
    coupon_discount_type: base.coupon_code ? 'percentage' : null,
    coupon_discount_value: base.coupon_code ? 10 : null,
    status_history: STATUSES.slice(0, STATUSES.indexOf(base.status) + 1).map((s, idx) => ({
      status: s,
      changed_at: new Date(Date.now() - (STATUSES.indexOf(base.status) - idx) * 1000 * 60 * 60).toISOString(),
      changed_by_id: 'admin-1',
      changed_by_name: 'Admin User',
      note: null,
    })),
    notes: [],
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string
): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function addOrderNote(id: string, content: string): Promise<{ success: boolean }> {
  await delay(300);
  return { success: true };
}

export async function cancelOrder(id: string, reason: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function getPrintingQueue(status?: string) {
  await delay();
  const items = Array.from({ length: 24 }, (_, i) => makeOrder(i + 100));
  return { items, total: 24 };
}
