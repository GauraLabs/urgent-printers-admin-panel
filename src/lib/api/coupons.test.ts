import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from './client';
import { createCoupon, updateCoupon } from './coupons';

vi.mock('./client');
const raw = { id: 1, discount_value: '10', min_order_amount: null, max_discount_amount: null, applicable_product_ids: [3], applicable_category_ids: [] };

beforeEach(() => { vi.mocked(client.post).mockResolvedValue(raw); vi.mocked(client.patch).mockResolvedValue(raw); });

describe('coupon scope on the wire', () => {
  it('sends integer ids and normalises responses to strings', async () => {
    const out = await createCoupon({ code: 'A', discount_type: 'fixed', discount_value: 1, valid_from: '2026-01-01', applicable_product_ids: ['3'], applicable_category_ids: ['4'] });
    expect(vi.mocked(client.post).mock.calls[0][1]).toMatchObject({ applicable_product_ids: [3], applicable_category_ids: [4] });
    expect(out.applicable_product_ids).toEqual(['3']);
  });
  it('omits scope keys when not provided', async () => {
    await updateCoupon('1', { code: 'A' });
    expect(vi.mocked(client.patch).mock.calls[0][1]).toEqual({ code: 'A' });
  });
});
