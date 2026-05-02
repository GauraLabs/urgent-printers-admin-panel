export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';
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
}

export interface Refund {
  id: string;
  payment_id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  reason: RefundReason;
  notes: string | null;
  status: RefundStatus;
  processed_by_id: string | null;
  processed_by_name: string | null;
  transaction_id: string | null;
  created_at: string;
  completed_at: string | null;
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
  amount: number;
  reason: RefundReason;
  notes?: string;
}
