import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  artwork_pending: 'Awaiting Artwork Approval',
  artwork_approved: 'Artwork Approved',
  printing: 'Printing',
  ready_to_dispatch: 'Ready to Dispatch',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_initiated: 'Refund Initiated',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  placed: 'warning',
  confirmed: 'info',
  artwork_pending: 'warning',
  artwork_approved: 'info',
  printing: 'info',
  ready_to_dispatch: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refund_initiated: 'warning',
  refunded: 'default',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'confirmed',
  'artwork_pending',
  'artwork_approved',
  'printing',
  'ready_to_dispatch',
  'shipped',
];
