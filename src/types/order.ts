export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'artwork_pending'
  | 'artwork_approved'
  | 'printing'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type TurnaroundType = 'standard' | 'express' | 'rush';
export type ArtworkStatus = 'pending' | 'approved' | 'rejected' | 'reupload_requested';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  size: string;
  paper_type: string;
  finish: string;
  sides: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  turnaround: TurnaroundType;
  artwork_status: ArtworkStatus;
  artwork_file_url: string | null;
  artwork_preview_url: string | null;
  artwork_notes: string | null;
  custom_notes: string | null;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderPaymentInfo {
  method: string;
  provider: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  paid_at: string | null;
}

export interface OrderShippingInfo {
  courier: string | null;
  awb_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
}

export interface OrderNote {
  id: string;
  admin_id: string;
  admin_name: string;
  content: string;
  created_at: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changed_at: string;
  changed_by_id: string | null;
  changed_by_name: string | null;
  note: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  coupon_code: string | null;
  discount_amount: number;
  subtotal: number;
  turnaround: TurnaroundType;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  customer_phone: string;
  customer_total_orders: number;
  items: OrderItem[];
  payment: OrderPaymentInfo;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  shipping: OrderShippingInfo;
  coupon_discount_type: 'percentage' | 'fixed' | null;
  coupon_discount_value: number | null;
  status_history: OrderStatusHistory[];
  notes: OrderNote[];
}

export interface OrdersListResponse {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  turnaround?: TurnaroundType;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
