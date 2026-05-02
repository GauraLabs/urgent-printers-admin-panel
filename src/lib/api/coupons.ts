import type { Coupon, CouponAnalytics, CouponsListResponse, CouponFilters, CreateCouponRequest } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getCoupons(filters: CouponFilters = {}): Promise<CouponsListResponse> {
  await delay();
  const items: Coupon[] = [
    { id: 'c1', code: 'SAVE10', description: '10% off all orders', discount_type: 'percentage', discount_value: 10, min_order_amount: 500, max_discount_amount: 1000, usage_limit: 500, usage_count: 234, per_user_limit: 1, applicable_product_ids: [], applicable_category_ids: [], status: 'active', valid_from: '2026-01-01T00:00:00Z', valid_until: '2026-12-31T23:59:59Z', created_by_id: 'admin-1', created_by_name: 'Admin User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'c2', code: 'FLAT200', description: 'Flat ₹200 off', discount_type: 'fixed', discount_value: 200, min_order_amount: 1500, max_discount_amount: null, usage_limit: 100, usage_count: 89, per_user_limit: null, applicable_product_ids: [], applicable_category_ids: [], status: 'active', valid_from: '2026-01-01T00:00:00Z', valid_until: '2026-06-30T23:59:59Z', created_by_id: 'admin-1', created_by_name: 'Admin User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'c3', code: 'WELCOME20', description: '20% off for new customers', discount_type: 'percentage', discount_value: 20, min_order_amount: null, max_discount_amount: 2000, usage_limit: null, usage_count: 412, per_user_limit: 1, applicable_product_ids: [], applicable_category_ids: [], status: 'active', valid_from: '2025-01-01T00:00:00Z', valid_until: null, created_by_id: 'admin-1', created_by_name: 'Admin User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'c4', code: 'HOLIDAY30', description: '30% holiday sale', discount_type: 'percentage', discount_value: 30, min_order_amount: 2000, max_discount_amount: 3000, usage_limit: 200, usage_count: 200, per_user_limit: 1, applicable_product_ids: [], applicable_category_ids: [], status: 'exhausted', valid_from: '2025-12-20T00:00:00Z', valid_until: '2025-12-31T23:59:59Z', created_by_id: 'admin-1', created_by_name: 'Admin User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
  return { items, total: 4, page: 1, page_size: 20, total_pages: 1 };
}

export async function getCoupon(id: string): Promise<Coupon> {
  await delay(300);
  const list = await getCoupons();
  return list.items.find((c) => c.id === id) ?? list.items[0];
}

export async function getCouponAnalytics(id: string): Promise<CouponAnalytics> {
  await delay();
  return {
    coupon_id: id,
    total_uses: 234,
    total_discount_given: 46800,
    total_order_revenue: 421200,
    unique_customers: 198,
    avg_order_value: 1800,
    uses_over_time: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      uses: Math.floor(Math.random() * 20),
      discount: Math.floor(Math.random() * 4000),
    })),
  };
}

export async function createCoupon(data: CreateCouponRequest): Promise<Coupon> {
  await delay();
  const list = await getCoupons();
  return { ...list.items[0], id: `c-${Date.now()}`, code: data.code };
}

export async function updateCoupon(id: string, data: Partial<CreateCouponRequest>): Promise<Coupon> {
  await delay();
  return getCoupon(id);
}

export async function deleteCoupon(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}
