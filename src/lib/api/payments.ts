import type { Payment, Refund, PaymentsListResponse, RefundsListResponse, PaymentFilters, CreateRefundRequest } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

function makePayment(i: number): Payment {
  return {
    id: `pay-${i + 1}`,
    order_id: `ord-${3000 - i}`,
    order_number: `ORD-${3000 - i}`,
    customer_id: `cust-${i % 50}`,
    customer_name: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar'][i % 3],
    customer_email: ['rahul@example.com', 'priya@example.com', 'amit@example.com'][i % 3],
    method: ['UPI', 'Credit Card', 'Net Banking', 'Debit Card'][i % 4],
    provider: ['Razorpay', 'Razorpay', 'Paytm'][i % 3],
    transaction_id: `txn_${Math.random().toString(36).substr(2, 12)}`,
    amount: Math.floor(1500 + (i * 1337) % 15000),
    currency: 'INR',
    status: (['paid', 'paid', 'paid', 'paid', 'failed', 'refunded'] as const)[i % 6],
    paid_at: new Date(Date.now() - i * 1000 * 60 * 90).toISOString(),
    created_at: new Date(Date.now() - i * 1000 * 60 * 95).toISOString(),
  };
}

export async function getPayments(filters: PaymentFilters = {}): Promise<PaymentsListResponse> {
  await delay();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const total = 312;
  const items = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) =>
    makePayment((page - 1) * pageSize + i)
  );
  return { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) };
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
