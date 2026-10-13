import { get, post } from './client';
import type { Payment, PaymentStatus, Refund, PaymentsListResponse, RefundsListResponse, PaymentFilters, CreateRefundRequest, RefundResult, ResolveRefundRequest, PaymentAnomaly, PaymentAnomaliesResponse, PaymentAnomalyFilters } from '@/types';

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
  refund_pending: 'refund_pending',
};

export function normalisePaymentStatus(status: unknown): PaymentStatus {
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
    refund_unconfirmed: raw.refund_unconfirmed === true,
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

function normaliseRefund(raw: Record<string, unknown>): Refund {
  return {
    order_id: String(raw.order_id),
    order_number: raw.order_number as string,
    refund_id: raw.refund_id as string,
    amount: Number(raw.amount) || 0,
    reason: (raw.reason as Refund['reason'] | null) ?? null,
    status: (raw.status as string | null) ?? 'processed',
    created_at: (raw.created_at as string | null) ?? null,
    created_by: (raw.created_by as string | null) ?? null,
  };
}

export async function getRefunds(filters: Pick<PaymentFilters, 'page' | 'page_size'> = {}): Promise<RefundsListResponse> {
  const raw = await get<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('/admin/payments/refunds', { page: filters.page, page_size: filters.page_size });
  return {
    items: raw.items.map(normaliseRefund),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
  };
}

function normaliseRefundResult(raw: Record<string, unknown>): RefundResult {
  return {
    order_id: String(raw.order_id),
    order_number: raw.order_number as string,
    refund_id: (raw.refund_id as string | null) ?? null,
    refund_amount: Number(raw.refund_amount) || 0,
    payment_status: normalisePaymentStatus(raw.payment_status),
    order_status: raw.order_status as string,
    refunded_at: (raw.refunded_at as string | null) ?? null,
    refund_unconfirmed: raw.refund_unconfirmed === true,
  };
}

export async function createRefund(data: CreateRefundRequest): Promise<RefundResult> {
  const raw = await post<Record<string, unknown>>(`/admin/orders/${data.order_id}/refund`, {
    ...(data.amount !== undefined ? { amount: data.amount } : {}),
    reason: data.reason,
    ...(data.notes ? { notes: data.notes } : {}),
  });
  return normaliseRefundResult(raw);
}

export async function resolveRefund(data: ResolveRefundRequest): Promise<RefundResult> {
  const body =
    data.mode === 'attach'
      ? { mode: 'attach', refund_id: data.refund_id, amount: data.amount }
      : { mode: data.mode };
  const raw = await post<Record<string, unknown>>(`/admin/orders/${data.order_id}/refund/resolve`, body);
  return normaliseRefundResult(raw);
}

function normaliseAnomaly(raw: Record<string, unknown>): PaymentAnomaly {
  return {
    event_id: String(raw.event_id),
    event_type: raw.event_type as string,
    order_id: String(raw.order_id),
    order_number: raw.order_number as string,
    razorpay_order_id: (raw.razorpay_order_id as string | null) ?? null,
    razorpay_payment_id: (raw.razorpay_payment_id as string | null) ?? null,
    event_amount_paise: raw.event_amount_paise != null ? Number(raw.event_amount_paise) : null,
    order_total_paise: Number(raw.order_total_paise) || 0,
    order_status: raw.order_status as string,
    payment_status: raw.payment_status as string,
    refund_id: (raw.refund_id as string | null) ?? null,
    refund_unconfirmed: raw.refund_unconfirmed === true,
    resolved: Boolean(raw.resolved),
    created_at: (raw.created_at as string | null) ?? '',
  };
}

async function fetchAnomalyList(path: string, params: Record<string, unknown>): Promise<PaymentAnomaliesResponse> {
  const raw = await get<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>(path, params);
  return {
    items: raw.items.map(normaliseAnomaly),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
  };
}

export function getPaymentAnomalies(filters: PaymentAnomalyFilters = {}): Promise<PaymentAnomaliesResponse> {
  return fetchAnomalyList('/admin/payments/anomalies', {
    page: filters.page,
    page_size: filters.page_size,
    ...(filters.event_type ? { event_type: filters.event_type } : {}),
    ...(filters.unresolved_only ? { unresolved_only: true } : {}),
  });
}

export function getStuckPayments(filters: Pick<PaymentAnomalyFilters, 'page' | 'page_size'> = {}): Promise<PaymentAnomaliesResponse> {
  return fetchAnomalyList('/admin/payments/stuck', { page: filters.page, page_size: filters.page_size });
}
