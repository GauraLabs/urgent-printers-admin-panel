import { get } from './client';
import type { Payment, PaymentStatus, Refund, PaymentsListResponse, RefundsListResponse, PaymentFilters, CreateRefundRequest } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

// Backend's PaymentStatus enum (app/models/order.py) has two values the
// frontend's narrower Payment.status union doesn't: `awaiting_payment` (still
// mid-checkout, shown as pending here) and `partially_refunded` (spelled
// `partial_refund` on the frontend). Everything else passes through as-is.
const STATUS_MAP: Record<string, PaymentStatus> = {
  pending: 'pending',
  awaiting_payment: 'pending',
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded',
  partially_refunded: 'partial_refund',
};

function normalisePaymentStatus(status: unknown): PaymentStatus {
  return STATUS_MAP[status as string] ?? 'pending';
}

function normalisePayment(raw: Record<string, unknown>): Payment {
  return {
    id: String(raw.id),
    order_id: String(raw.order_id),
    order_number: raw.order_number as string,
    customer_id: String(raw.customer_id),
    customer_name: (raw.customer_name as string | null) ?? '',
    customer_email: (raw.customer_email as string | null) ?? '',
    method: (raw.method as string | null) ?? '',
    provider: (raw.provider as string | null) ?? 'razorpay',
    transaction_id: (raw.transaction_id as string | null) ?? '',
    amount: Number(raw.amount) || 0,
    currency: 'INR',
    status: normalisePaymentStatus(raw.status),
    paid_at: (raw.paid_at as string | null) ?? null,
    created_at: (raw.created_at as string | null) ?? '',
  };
}

export async function getPayments(filters: PaymentFilters = {}): Promise<PaymentsListResponse> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page,
    page_size: filters.page_size,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.method ? { method: filters.method } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
  const raw = await get<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('/admin/payments', params);
  return {
    items: raw.items.map(normalisePayment),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
  };
}

export async function getRefunds(filters: PaymentFilters = {}): Promise<RefundsListResponse> {
  await delay();
  const items: Refund[] = Array.from({ length: 12 }, (_, i) => ({
    id: `ref-${i + 1}`,
    payment_id: `pay-${i + 1}`,
    order_id: `ord-${2900 - i}`,
    order_number: `ORD-${2900 - i}`,
    customer_id: `cust-${i}`,
    customer_name: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar'][i % 3],
    amount: Math.floor(500 + (i * 317) % 5000),
    currency: 'INR',
    reason: (['customer_request', 'quality_issue', 'order_cancelled', 'wrong_item'] as const)[i % 4],
    notes: i % 2 === 0 ? 'Customer requested refund' : null,
    status: (['completed', 'pending', 'processing', 'completed', 'failed'] as const)[i % 5],
    processed_by_id: 'admin-1',
    processed_by_name: 'Admin User',
    transaction_id: i % 3 === 0 ? null : `rfnd_${Math.random().toString(36).substr(2, 10)}`,
    created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 12).toISOString(),
    completed_at: i % 3 !== 0 ? new Date(Date.now() - i * 1000 * 60 * 60 * 6).toISOString() : null,
  }));
  return { items, total: 47, page: 1, page_size: 20, total_pages: 3 };
}

export async function createRefund(data: CreateRefundRequest): Promise<{ success: boolean; refund_id: string }> {
  await delay();
  return { success: true, refund_id: `ref-${Date.now()}` };
}
