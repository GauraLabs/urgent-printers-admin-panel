import { describe, expect, it } from 'vitest';
import { couponSchema, getPercentTypoWarning, type CouponFormValues } from './couponSchema';

function base(over: Partial<CouponFormValues> = {}): CouponFormValues {
  return {
    code: 'SAVE10', discount_type: 'percentage', discount_value: 10, valid_from: '2026-01-01',
    is_active: true, trigger: null, is_personal: false, applies_to_discounted_items: true,
    scope: 'all', applicable_product_ids: [], applicable_category_ids: [], ...over,
  };
}
function paths(over: Partial<CouponFormValues>): string[] {
  const r = couponSchema.safeParse(base(over));
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('coupon bounds', () => {
  it('percentage must be above 0 and at most 100', () => {
    expect(paths({ discount_value: 0 })).toContain('discount_value');
    expect(paths({ discount_value: -5 })).toContain('discount_value');
    expect(paths({ discount_value: 100.01 })).toContain('discount_value');
    expect(paths({ discount_value: 150 })).toContain('discount_value');
    expect(paths({ discount_value: 100 })).toEqual([]);
    expect(paths({ discount_value: 0.01 })).toEqual([]);
  });
  it('fixed must be above 0 and fit numeric(12,2)', () => {
    expect(paths({ discount_type: 'fixed', discount_value: 0 })).toContain('discount_value');
    expect(paths({ discount_type: 'fixed', discount_value: 150 })).toEqual([]);
    expect(paths({ discount_type: 'fixed', discount_value: 1e10 })).toContain('discount_value');
    expect(paths({ discount_type: 'fixed', discount_value: 9_999_999_999.99 })).toEqual([]);
    expect(paths({ discount_type: 'fixed', discount_value: 1.234 })).toContain('discount_value');
  });
  it('blocks a blank (NaN) value and a null type', () => {
    expect(paths({ discount_value: NaN })).toContain('discount_value');
    expect(paths({ discount_type: null as unknown as 'fixed' })).toContain('discount_type');
  });
  it('max discount cap: above 0 or empty', () => {
    expect(paths({ max_discount_amount: 0 })).toContain('max_discount_amount');
    expect(paths({ max_discount_amount: -1 })).toContain('max_discount_amount');
    expect(paths({ max_discount_amount: undefined })).toEqual([]);
    expect(paths({ max_discount_amount: 500 })).toEqual([]);
    expect(paths({ max_discount_amount: 1e10 })).toContain('max_discount_amount');
  });
  it('min order: 0 or more', () => {
    expect(paths({ min_order_amount: -1 })).toContain('min_order_amount');
    expect(paths({ min_order_amount: 0 })).toEqual([]);
    expect(paths({ min_order_amount: 1e10 })).toContain('min_order_amount');
  });
  it('valid_until must be after valid_from', () => {
    expect(paths({ valid_until: '2026-01-01' })).toContain('valid_until');
    expect(paths({ valid_until: '2025-12-31' })).toContain('valid_until');
    expect(paths({ valid_until: '2026-01-02' })).toEqual([]);
    expect(paths({ valid_until: '' })).toEqual([]);
  });
});

describe('getPercentTypoWarning', () => {
  it('warns over 50% for percentage coupons only', () => {
    expect(getPercentTypoWarning('percentage', 150)).toBeNull();
    expect(getPercentTypoWarning('percentage', 60)).toMatch(/60%/);
    expect(getPercentTypoWarning('percentage', 50)).toBeNull();
    expect(getPercentTypoWarning('fixed', 500)).toBeNull();
    expect(getPercentTypoWarning('percentage', NaN)).toBeNull();
  });
});

describe('coupon integer limits', () => {
  it.each(['usage_limit', 'per_user_limit'] as const)('%s: whole number from 1 to 2,147,483,647', (k) => {
    expect(paths({ [k]: 0 })).toContain(k);
    expect(paths({ [k]: 1.5 })).toContain(k);
    expect(paths({ [k]: 2_147_483_648 })).toContain(k);
    expect(paths({ [k]: 2_147_483_647 })).toEqual([]);
    expect(paths({ [k]: undefined })).toEqual([]);
  });
});

describe('coupon scope', () => {
  it('all products needs no ids', () => {
    expect(paths({})).toEqual([]);
  });
  it('specific scope needs at least one product or category', () => {
    expect(paths({ scope: 'specific' })).toEqual(['scope']);
    expect(paths({ scope: 'specific', applicable_product_ids: ['1'] })).toEqual([]);
    expect(paths({ scope: 'specific', applicable_category_ids: ['2'] })).toEqual([]);
  });
});
