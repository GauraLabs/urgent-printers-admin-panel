import { describe, expect, it } from 'vitest';
import { canRefundOrder, canResolveRefund } from './refundState';
import type { OrderStatus, PaymentStatus } from '@/types';

const order = (status: OrderStatus, payment: PaymentStatus, refund_unconfirmed = false) => ({ status, payment: { status: payment, refund_unconfirmed } });

describe('canRefundOrder', () => {
  it('allows paid shipped, delivered and cancelled orders', () => {
    expect(canRefundOrder(order('shipped', 'paid'))).toBe(true);
    expect(canRefundOrder(order('delivered', 'paid'))).toBe(true);
    expect(canRefundOrder(order('cancelled', 'paid'))).toBe(true);
  });
  it('allows any order whose payment is refund_pending', () => {
    expect(canRefundOrder(order('cancelled', 'refund_pending'))).toBe(true);
    expect(canRefundOrder(order('printing', 'refund_pending'))).toBe(true);
  });
  it('blocks unpaid, already refunded and unconfirmed refunds', () => {
    expect(canRefundOrder(order('delivered', 'pending'))).toBe(false);
    expect(canRefundOrder(order('delivered', 'refunded'))).toBe(false);
    expect(canRefundOrder(order('cancelled', 'refund_pending', true))).toBe(false);
    expect(canRefundOrder(order('printing', 'paid'))).toBe(false);
  });
});

describe('canResolveRefund', () => {
  it('is only for super admins on an unconfirmed refund', () => {
    const stuck = order('cancelled', 'refund_pending', true);
    expect(canResolveRefund(stuck, true)).toBe(true);
    expect(canResolveRefund(stuck, false)).toBe(false);
    expect(canResolveRefund(order('cancelled', 'refund_pending'), true)).toBe(false);
  });
});
