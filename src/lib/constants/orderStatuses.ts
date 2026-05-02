import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  artwork_pending: 'Artwork Pending',
  artwork_approved: 'Artwork Approved',
  printing: 'Printing',
  ready_to_dispatch: 'Ready to Dispatch',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'warning',
  confirmed: 'info',
  artwork_pending: 'warning',
  artwork_approved: 'info',
  printing: 'info',
  ready_to_dispatch: 'info',
  dispatched: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'confirmed',
  'artwork_pending',
  'artwork_approved',
  'printing',
  'ready_to_dispatch',
];
