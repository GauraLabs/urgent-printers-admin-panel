export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'artwork_pending'
  | 'artwork_approved'
  | 'printing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_initiated'
  | 'refunded';

export type TurnaroundType = 'standard' | 'express' | 'rush';
export type ArtworkStatus = 'none' | 'sent_for_approval' | 'approved' | 'needs_revision';
export type ProofStatus = 'pending_review' | 'sent' | 'approved' | 'rejected' | 'superseded';

export interface OrderItemProof {
  id: number;
  order_item_id: string;
  file_key: string;
  original_filename: string;
  file_url: string;
  status: ProofStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PresignProofResponse {
  upload_url: string;
  file_key: string;
  proof_id: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  thumbnail_url: string | null;
  category_name: string | null;
  size_label: string | null;
  paper_label: string | null;
  finish_label: string | null;
  sides: string | null;
  turnaround_label: string | null;
  quantity: number;
  price_per_unit: number;
  turnaround_extra_cost: number;
  total_price: number;
  artwork_status: ArtworkStatus;
  artwork_file_key: string | null;
  artwork_filename: string | null;
  artwork_type: 'file' | 'template' | null;
  template_data: Record<string, string> | null;
}

export interface OrderAddress {
  full_name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string | null;
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
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
}

export interface OrderNote {
  id: string;
  order_id: string;
  admin_user_id: string;
  admin_user_name: string;
  content: string;
  created_at: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changed_at: string;
  changed_by_name: string | null;
  note: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_id: number | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  currency: string;
  coupon_code: string | null;
  discount_amount: number;
  subtotal: number;
  turnaround: string | string[] | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Omit<Order, 'turnaround'> {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_total_orders: number;
  turnaround: string | string[];
  items: OrderItem[];
  payment: OrderPaymentInfo;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  shipping: OrderShippingInfo;
  gst_amount: number;
  shipping_cost: number;
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
  turnaround?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
