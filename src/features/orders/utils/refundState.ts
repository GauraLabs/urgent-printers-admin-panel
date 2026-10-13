import type { OrderStatus, PaymentStatus } from '@/types';

const REFUNDABLE_ORDER_STATUSES: OrderStatus[] = ['shipped', 'delivered', 'cancelled', 'refund_initiated'];

interface RefundCheckInput {
  status: OrderStatus;
  payment: { status: PaymentStatus; refund_unconfirmed: boolean };
}

export function canRefundOrder(order: RefundCheckInput): boolean {
  if (order.payment.refund_unconfirmed) return false;
  if (order.payment.status === 'refund_pending') return true;
  return order.payment.status === 'paid' && REFUNDABLE_ORDER_STATUSES.includes(order.status);
}

export function canResolveRefund(order: RefundCheckInput, isSuperAdmin: boolean): boolean {
  return isSuperAdmin && order.payment.refund_unconfirmed;
}
