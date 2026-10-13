export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund' | 'refund_pending';
export type RefundReason =
  | 'customer_request'
  | 'order_cancelled'
  | 'quality_issue'
  | 'wrong_item'
  | 'damaged'
  | 'other';

export interface Payment {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  method: string;
  provider: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  refund_unconfirmed: boolean;
}

export interface Refund {
  order_id: string;
  order_number: string;
  refund_id: string;
  /** Rupees. */
  amount: number;
  reason: RefundReason | null;
  /** Provider status as reported by Razorpay (e.g. processed, pending, failed). */
  status: string;
  created_at: string | null;
  created_by: string | null;
}

export interface PaymentsListResponse {
  items: Payment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RefundsListResponse {
  items: Refund[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface CreateRefundRequest {
  order_id: string;
  /** Rupees. Omit to refund the full paid amount. */
  amount?: number;
  reason: RefundReason;
  notes?: string;
}

export interface RefundResult {
  order_id: string;
  order_number: string;
  /** Null while the refund is unconfirmed. */
  refund_id: string | null;
  refund_amount: number;
  payment_status: PaymentStatus;
  order_status: string;
  refunded_at: string | null;
  refund_unconfirmed: boolean;
}

export type ResolveRefundRequest =
  | { order_id: string; mode: 'attach'; refund_id: string; amount: number }
  | { order_id: string; mode: 'clear' | 'reconcile' };

export interface PaymentAnomaly {
  event_id: string;
  event_type: string;
  order_id: string;
  order_number: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  event_amount_paise: number | null;
  order_total_paise: number;
  order_status: string;
  payment_status: string;
  refund_id: string | null;
  refund_unconfirmed: boolean;
  resolved: boolean;
  created_at: string;
}

export interface PaymentAnomalyFilters {
  event_type?: string;
  unresolved_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaymentAnomaliesResponse {
  items: PaymentAnomaly[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
