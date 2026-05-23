export type DiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'exhausted';
export type CouponTrigger = 'on_signup' | 'on_nth_order' | 'on_spend_milestone';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number | null;
  applicable_product_ids: string[];
  applicable_category_ids: string[];
  status: CouponStatus;
  valid_from: string;
  valid_until: string | null;
  trigger: CouponTrigger | null;
  trigger_config: Record<string, unknown>;
  is_personal: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CouponAnalytics {
  coupon_id: string;
  total_uses: number;
  total_discount_given: number;
  total_order_revenue: number;
  unique_customers: number;
  avg_order_value: number;
  uses_over_time: Array<{ date: string; uses: number }>;
}

export interface CouponsListResponse {
  items: Coupon[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CouponFilters {
  status?: CouponStatus;
  discount_type?: DiscountType;
  trigger?: CouponTrigger;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  applicable_product_ids?: string[];
  applicable_category_ids?: string[];
  valid_from: string;
  valid_until?: string;
  trigger?: CouponTrigger | null;
  trigger_config?: Record<string, unknown>;
  is_personal?: boolean;
  is_active?: boolean;
}
