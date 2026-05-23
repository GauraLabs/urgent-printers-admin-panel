import { get, post, patch, del } from './client';
import type { Coupon, CouponAnalytics, CouponsListResponse, CouponFilters, CreateCouponRequest, CouponTrigger } from '@/types';

// ── Normalizer ────────────────────────────────────────────────────────────────
// Backend returns id as int and Decimal fields as strings ("10.00")

type RawCoupon = Omit<Coupon, 'id' | 'discount_value' | 'min_order_amount' | 'max_discount_amount' | 'applicable_product_ids' | 'applicable_category_ids'> & {
  id: number | string;
  discount_value: number | string;
  min_order_amount: number | string | null;
  max_discount_amount: number | string | null;
  applicable_product_ids: Array<number | string>;
  applicable_category_ids: Array<number | string>;
};

function normalize(raw: RawCoupon): Coupon {
  return {
    ...raw,
    id: String(raw.id),
    discount_value: Number(raw.discount_value),
    min_order_amount: raw.min_order_amount != null ? Number(raw.min_order_amount) : null,
    max_discount_amount: raw.max_discount_amount != null ? Number(raw.max_discount_amount) : null,
    applicable_product_ids: raw.applicable_product_ids.map(String),
    applicable_category_ids: raw.applicable_category_ids.map(String),
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
interface RawListResponse {
  items: RawCoupon[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export async function getCoupons(filters: CouponFilters = {}): Promise<CouponsListResponse> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    page_size: filters.page_size ?? 20,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.discount_type) params.discount_type = filters.discount_type;
  if (filters.trigger) params.trigger = filters.trigger;

  const res = await get<RawListResponse>('/admin/coupons', params);
  return { ...res, items: res.items.map(normalize) };
}

// ── Single ────────────────────────────────────────────────────────────────────
export async function getCoupon(id: string): Promise<Coupon> {
  const raw = await get<RawCoupon>(`/admin/coupons/${id}`);
  return normalize(raw);
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getCouponAnalytics(id: string): Promise<CouponAnalytics> {
  const data = await get<Omit<CouponAnalytics, 'coupon_id'> & { coupon_id: number | string }>(
    `/admin/coupons/${id}/analytics`
  );
  return { ...data, coupon_id: String(data.coupon_id) };
}

// ── Create / Update ───────────────────────────────────────────────────────────
export async function createCoupon(data: CreateCouponRequest): Promise<Coupon> {
  const raw = await post<RawCoupon>('/admin/coupons', data);
  return normalize(raw);
}

export async function updateCoupon(id: string, data: Partial<CreateCouponRequest>): Promise<Coupon> {
  const raw = await patch<RawCoupon>(`/admin/coupons/${id}`, data);
  return normalize(raw);
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteCoupon(id: string): Promise<void> {
  await del<void>(`/admin/coupons/${id}`);
}
