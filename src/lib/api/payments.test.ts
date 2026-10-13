import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRefunds, createRefund, resolveRefund, getPaymentAnomalies, getStuckPayments, normalisePaymentStatus } from './payments';
import { updateOrderStatus } from './orders';
import * as client from './client';

vi.mock('./client');
const mocked = vi.mocked(client);

const REFUND_RESPONSE = {
  order_id: 42, order_number: 'UP-42', refund_id: 'rfnd_abc', refund_amount: '1500.00', refund_unconfirmed: false,
  payment_status: 'refunded', order_status: 'refund_initiated', refunded_at: '2026-10-13T10:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

describe('createRefund', () => {
  it('posts to the real endpoint and normalises the response', async () => {
    mocked.post.mockResolvedValue(REFUND_RESPONSE);
    const res = await createRefund({ order_id: '42', amount: 500.5, reason: 'quality_issue', notes: 'smudged' });
    expect(mocked.post).toHaveBeenCalledWith('/admin/orders/42/refund', { amount: 500.5, reason: 'quality_issue', notes: 'smudged' });
    expect(res).toEqual({
      order_id: '42', order_number: 'UP-42', refund_id: 'rfnd_abc', refund_amount: 1500,
      payment_status: 'refunded', order_status: 'refund_initiated', refunded_at: '2026-10-13T10:00:00Z', refund_unconfirmed: false,
    });
  });

  it('omits amount and empty notes for a full refund', async () => {
    mocked.post.mockResolvedValue(REFUND_RESPONSE);
    await createRefund({ order_id: '42', reason: 'other', notes: '' });
    expect(mocked.post).toHaveBeenCalledWith('/admin/orders/42/refund', { reason: 'other' });
  });

  it('propagates backend errors', async () => {
    mocked.post.mockRejectedValue({ status: 409, code: 'refund_already_issued', message: 'x' });
    await expect(createRefund({ order_id: '1', reason: 'other' })).rejects.toMatchObject({ code: 'refund_already_issued' });
  });
});

describe('resolveRefund', () => {
  it('sends attach payload', async () => {
    mocked.post.mockResolvedValue(REFUND_RESPONSE);
    await resolveRefund({ order_id: '42', mode: 'attach', refund_id: 'rfnd_x', amount: 100 });
    expect(mocked.post).toHaveBeenCalledWith('/admin/orders/42/refund/resolve', { mode: 'attach', refund_id: 'rfnd_x', amount: 100 });
  });
  it.each(['clear', 'reconcile'] as const)('sends %s payload with nothing else', async (mode) => {
    mocked.post.mockResolvedValue(REFUND_RESPONSE);
    await resolveRefund({ order_id: '42', mode });
    expect(mocked.post).toHaveBeenCalledWith('/admin/orders/42/refund/resolve', { mode });
  });
});

describe('anomalies and stuck', () => {
  const RAW = {
    items: [{
      event_id: 7, event_type: 'verify_amount_mismatch', order_id: 3, order_number: 'UP-3',
      razorpay_order_id: 'order_1', razorpay_payment_id: null, event_amount_paise: 5000, order_total_paise: 6000,
      order_status: 'placed', payment_status: 'awaiting_payment', refund_id: null, refund_unconfirmed: true, resolved: false, created_at: '2026-10-13T00:00:00Z',
    }],
    total: 1, page: 1, page_size: 20, total_pages: 1,
  };

  it('passes filters and normalises ids', async () => {
    mocked.get.mockResolvedValue(RAW);
    const res = await getPaymentAnomalies({ event_type: 'verify_amount_mismatch', unresolved_only: true, page: 2, page_size: 20 });
    expect(mocked.get).toHaveBeenCalledWith('/admin/payments/anomalies', {
      page: 2, page_size: 20, event_type: 'verify_amount_mismatch', unresolved_only: true,
    });
    expect(res.items[0]).toMatchObject({ event_id: '7', order_id: '3', event_amount_paise: 5000, resolved: false });
  });

  it('omits unset filters', async () => {
    mocked.get.mockResolvedValue(RAW);
    await getPaymentAnomalies({ page: 1 });
    expect(mocked.get).toHaveBeenCalledWith('/admin/payments/anomalies', { page: 1, page_size: undefined });
  });

  it('calls the stuck endpoint', async () => {
    mocked.get.mockResolvedValue(RAW);
    await getStuckPayments({ page: 1, page_size: 20 });
    expect(mocked.get).toHaveBeenCalledWith('/admin/payments/stuck', { page: 1, page_size: 20 });
  });
});

describe('payment status', () => {
  it('maps refund_pending', () => {
    expect(normalisePaymentStatus('refund_pending')).toBe('refund_pending');
    expect(normalisePaymentStatus('partially_refunded')).toBe('partial_refund');
  });
});

describe('updateOrderStatus', () => {
  it('sends the note and tracking number', async () => {
    mocked.patch.mockResolvedValue({});
    await updateOrderStatus('9', 'shipped', 'TRK1', '  left at 4pm ');
    expect(mocked.patch).toHaveBeenCalledWith('/admin/orders/9/status', { status: 'shipped', tracking_number: 'TRK1', note: 'left at 4pm' });
  });
  it('omits blank note and tracking', async () => {
    mocked.patch.mockResolvedValue({});
    await updateOrderStatus('9', 'printing', undefined, '   ');
    expect(mocked.patch).toHaveBeenCalledWith('/admin/orders/9/status', { status: 'printing' });
  });
});

describe('getRefunds', () => {
  it('calls the real endpoint and normalises rows', async () => {
    mocked.get.mockResolvedValue({
      items: [{ order_id: 5, order_number: 'UP-5', refund_id: 'rfnd_1', amount: '250.00', reason: null, status: 'processed', created_at: null, created_by: 'Asha' }],
      total: 1, page: 1, page_size: 20, total_pages: 1,
    });
    const res = await getRefunds({ page: 1, page_size: 20 });
    expect(mocked.get).toHaveBeenCalledWith('/admin/payments/refunds', { page: 1, page_size: 20 });
    expect(res.items[0]).toEqual({ order_id: '5', order_number: 'UP-5', refund_id: 'rfnd_1', amount: 250, reason: null, status: 'processed', created_at: null, created_by: 'Asha' });
  });
});
