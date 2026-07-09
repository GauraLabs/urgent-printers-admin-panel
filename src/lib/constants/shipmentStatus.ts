import type { ShipmentStatus } from '@/types';

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  created: 'Created',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rto: 'RTO',
  cancelled: 'Cancelled',
};

export const SHIPMENT_STATUS_VARIANT: Record<ShipmentStatus, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  created: 'default',
  picked_up: 'info',
  in_transit: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  rto: 'danger',
  cancelled: 'danger',
};
