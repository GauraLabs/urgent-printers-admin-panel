import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderCoupon, couponSummaryParts } from './OrderCoupon';
import { OrderItems } from './OrderItems';
import { normaliseCouponSnapshot } from '@/lib/api/orders';
import type { CouponSnapshot, OrderItem } from '@/types';

const snap: CouponSnapshot = {
  product_ids: ['1', '2'], category_ids: [], product_names: ['Wedding Tags', 'Shagun Envelopes'], category_names: [],
  all_items: false, applies_to_discounted_items: false, minimum_order_amount: null, type: 'percentage', value: 10,
  max_discount: 500, eligible_line_indexes: [0, 1], line_count: 3,
};

describe('OrderCoupon', () => {
  it('summarises the snapshot', () => {
    render(<OrderCoupon code="FESTIVE10" discountAmount={120} snapshot={snap} appliedTo={{ eligible: 2, total: 3 }} />);
    expect(screen.getByTestId('coupon-summary')).toHaveTextContent(
      '10% off (max ₹500) · Applied to 2 of 3 items · Scope: Wedding Tags, Shagun Envelopes · Excludes discounted items',
    );
    expect(screen.getByText('Saved ₹120')).toBeInTheDocument();
  });

  it('shows nothing new for a legacy order (null snapshot)', () => {
    render(<OrderCoupon code="OLD" discountAmount={50} snapshot={null} appliedTo={null} />);
    expect(screen.queryByTestId('coupon-summary')).toBeNull();
    expect(screen.getByText('OLD')).toBeInTheDocument();
    expect(couponSummaryParts(null, null)).toEqual([]);
  });

  it('omits scope for all-items coupons, shows fixed amounts and the minimum', () => {
    const parts = couponSummaryParts({ ...snap, all_items: true, applies_to_discounted_items: true, type: 'fixed', value: 200, max_discount: null, minimum_order_amount: 1000 }, { eligible: 1, total: 1 });
    expect(parts).toEqual(['₹200 off', 'Applied to 1 of 1 item', 'Min. order ₹1,000']);
  });

  it('falls back to counts when names are missing', () => {
    expect(couponSummaryParts({ ...snap, product_names: [], category_ids: ['3'] }, null)).toContain('Scope: 3 selected products/categories');
  });
});

describe('normaliseCouponSnapshot', () => {
  it('returns null for legacy data and converts string money', () => {
    expect(normaliseCouponSnapshot(null)).toBeNull();
    expect(normaliseCouponSnapshot(undefined)).toBeNull();
    const n = normaliseCouponSnapshot({ product_ids: [1], type: 'fixed', value: '200.00', max_discount: null, minimum_order_amount: '500.00', all_items: true, eligible_line_indexes: [0], line_count: 2 });
    expect(n).toMatchObject({ product_ids: ['1'], value: 200, minimum_order_amount: 500, max_discount: null, type: 'fixed' });
  });
});

describe('OrderItems coupon tag', () => {
  const item = (over: Partial<OrderItem>): OrderItem => ({
    id: '1', product_id: '9', product_name: 'Cards', product_slug: 'c', thumbnail_url: null, category_name: null,
    size_label: null, paper_label: null, finish_label: null, sides: null, turnaround_label: null,
    quantity: 100, pack_size: 1, unit_label: 'pcs', price_per_unit: 9, mrp_per_unit: null, discount_per_unit: null, line_savings: null,
    turnaround_extra_cost: 0, total_price: 900, artwork_status: 'pending' as OrderItem['artwork_status'],
    artwork_file_key: null, artwork_filename: null, artwork_type: null, template_data: null, ...over,
  });
  it('tags only explicitly ineligible lines', () => {
    render(<OrderItems items={[item({ id: 'a', coupon_eligible: false }), item({ id: 'b', coupon_eligible: true }), item({ id: 'c', coupon_eligible: null }), item({ id: 'd' })]} />);
    expect(screen.getAllByTestId('not-in-coupon')).toHaveLength(1);
  });
});
