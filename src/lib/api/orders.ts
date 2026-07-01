import { get, post, patch } from './client';
import type {
  Order,
  OrderWithDetails,
  OrdersListResponse,
  OrderFilters,
  OrderStatus,
  OrderItemProof,
  PresignProofResponse,
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
  const raw = await get<Record<string, unknown>>(`/admin/orders/${id}`);
  return normaliseOrder(raw);
}

function normaliseOrder(raw: Record<string, unknown>): OrderWithDetails {
  const normaliseId = (v: unknown): string => String(v);

  const items = (raw.items as Record<string, unknown>[]).map((item) => ({
    id: normaliseId(item.id),
    product_id: normaliseId(item.product_id),
    product_name: item.product_name as string,
    product_slug: item.product_slug as string,
    thumbnail_url: (item.thumbnail_url as string | null) ?? null,
    size_label: (item.size_label as string | null) ?? null,
    paper_label: (item.paper_label as string | null) ?? null,
    finish_label: (item.finish_label as string | null) ?? null,
    sides: (item.sides as string | null) ?? null,
    turnaround_label: (item.turnaround_label as string | null) ?? null,
    quantity: item.quantity as number,
    price_per_unit: item.price_per_unit as number,
    total_price: item.total_price as number,
    artwork_status: (item.artwork_status as string) as import('@/types').ArtworkStatus,
    artwork_file_key: (item.artwork_file_key as string | null) ?? null,
    template_data: (item.template_data as Record<string, unknown> | null) ?? null,
  }));

  const notes = (raw.notes as Record<string, unknown>[]).map((n) => ({
    id: normaliseId(n.id),
    order_id: normaliseId(n.order_id),
    admin_user_id: normaliseId(n.admin_user_id),
    admin_user_name: n.admin_user_name as string,
    content: n.content as string,
    created_at: n.created_at as string,
  }));

  const statusHistory = (raw.status_history as Record<string, unknown>[]).map((h) => ({
    status: h.status as import('@/types').OrderStatus,
    changed_at: h.changed_at as string,
    changed_by_name: (h.changed_by_name as string | null) ?? null,
    note: (h.note as string | null) ?? null,
  }));

  const payment = raw.payment as Record<string, unknown>;
  const shipping = raw.shipping as Record<string, unknown>;
  const shippingAddress = raw.shipping_address as Record<string, unknown>;
  const billingAddress = raw.billing_address as Record<string, unknown>;

  return {
    id: normaliseId(raw.id),
    order_number: raw.order_number as string,
    status: raw.status as import('@/types').OrderStatus,
    customer_id: normaliseId(raw.customer_id),
    customer_name: raw.customer_name as string,
    customer_email: raw.customer_email as string,
    customer_phone: (raw.customer_phone as string) ?? '',
    customer_total_orders: raw.customer_total_orders as number,
    total_amount: raw.total_amount as number,
    currency: 'INR',
    coupon_code: (raw.coupon_code as string | null) ?? null,
    discount_amount: raw.discount_amount as number,
    subtotal: raw.subtotal as number,
    gst_amount: raw.gst_amount as number,
    shipping_cost: raw.shipping_cost as number,
    turnaround: raw.turnaround as string | string[],
    items,
    payment: {
      method: payment.method as string,
      provider: payment.provider as string,
      transaction_id: payment.transaction_id as string,
      amount: payment.amount as number,
      currency: 'INR',
      status: payment.status as import('@/types').OrderPaymentInfo['status'],
      paid_at: (payment.paid_at as string | null) ?? null,
    },
    shipping_address: {
      full_name: shippingAddress.full_name as string,
      line1: shippingAddress.line1 as string,
      line2: (shippingAddress.line2 as string | null) ?? null,
      city: shippingAddress.city as string,
      state: shippingAddress.state as string,
      pincode: shippingAddress.pincode as string,
      country: shippingAddress.country as string,
      phone: (shippingAddress.phone as string | null) ?? null,
    },
    billing_address: {
      full_name: billingAddress.full_name as string,
      line1: billingAddress.line1 as string,
      line2: (billingAddress.line2 as string | null) ?? null,
      city: billingAddress.city as string,
      state: billingAddress.state as string,
      pincode: billingAddress.pincode as string,
      country: billingAddress.country as string,
      phone: (billingAddress.phone as string | null) ?? null,
    },
    shipping: {
      courier: (shipping.courier as string | null) ?? null,
      tracking_number: (shipping.tracking_number as string | null) ?? null,
      tracking_url: (shipping.tracking_url as string | null) ?? null,
      estimated_delivery: (shipping.estimated_delivery as string | null) ?? null,
      dispatched_at: (shipping.dispatched_at as string | null) ?? null,
      delivered_at: (shipping.delivered_at as string | null) ?? null,
    },
    status_history: statusHistory,
    notes,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  trackingNumber?: string
): Promise<{ success: boolean }> {
  await patch(`/admin/orders/${id}/status`, {
    status,
    ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
  });
  return { success: true };
}

export async function addOrderNote(id: string, content: string): Promise<{ success: boolean }> {
  await post(`/admin/orders/${id}/notes`, { content });
  return { success: true };
}

export async function cancelOrder(id: string, reason: string): Promise<{ success: boolean }> {
  await post(`/admin/orders/${id}/cancel`, { reason });
  return { success: true };
}

export async function getPrintingQueue(status?: string) {
  await delay();
  const items = Array.from({ length: 24 }, (_, i) => makeOrder(i + 100));
  return { items, total: 24 };
}

export async function presignProof(orderId: string, itemId: string, filename: string): Promise<PresignProofResponse> {
  return post<PresignProofResponse>(`/admin/orders/${orderId}/items/${itemId}/proof/presign`, { filename });
}

export async function getOrderProofs(orderId: string): Promise<OrderItemProof[]> {
  return get<OrderItemProof[]>(`/admin/orders/${orderId}/proofs`);
}

export async function sendProofForApproval(orderId: string, itemId: string): Promise<void> {
  await post<void>(`/admin/orders/${orderId}/items/${itemId}/proof/send`);
}
