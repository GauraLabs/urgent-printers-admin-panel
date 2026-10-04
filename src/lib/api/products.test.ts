import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProduct, updateProduct } from './products';
import * as client from './client';

vi.mock('./client');
const mocked = vi.mocked(client);

const RAW = {
  id: 5, category_id: 3, name: 'Cards', slug: 'cards', images: [], sides_options: [],
  pricing_tiers: [
    { quantity: 100, price_per_unit: 9, mrp_per_unit: 12, discount_percent: 25, discount_per_unit: 3, is_best_value: false },
    { quantity: 500, price_per_unit: 7, is_best_value: true },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe('products API normaliser', () => {
  it('passes discount fields through and normalises ids', async () => {
    mocked.get.mockResolvedValue({
      ...RAW, discount_starts_at: '2030-01-01T00:00:00Z', discount_ends_at: null,
      discount: { status: 'scheduled', max_percent: 25 },
    });
    const p = await getProduct('5');
    expect(p.id).toBe('5');
    expect(p.pricing_tiers[0]).toMatchObject({ mrp_per_unit: 12, discount_percent: 25, discount_per_unit: 3 });
    expect(p.discount_starts_at).toBe('2030-01-01T00:00:00Z');
    expect(p.discount).toEqual({ status: 'scheduled', max_percent: 25 });
    expect(p.min_price).toBe(7);
  });

  it('defaults for an older backend that omits the new fields', async () => {
    mocked.get.mockResolvedValue(RAW);
    const p = await getProduct('5');
    expect(p.pricing_tiers[1].mrp_per_unit).toBeNull();
    expect(p.discount_starts_at).toBeNull();
    expect(p.discount_ends_at).toBeNull();
    expect(p.discount).toEqual({ status: 'none', max_percent: null });
  });

  it('forwards the PATCH body unchanged', async () => {
    mocked.patch.mockResolvedValue(RAW);
    const body = { pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: null }], discount_ends_at: null };
    await updateProduct('5', body);
    expect(mocked.patch).toHaveBeenCalledWith('/admin/products/5', body);
  });

  it('defaults sides is_active to true for older payloads and preserves false', async () => {
    mocked.get.mockResolvedValue({ ...RAW, sides_options: ['Single Sided', { label: 'Double', is_default: false, price_multiplier: 1.35 }, { label: 'Off', is_active: false, is_default: false, price_multiplier: 1 }] });
    const p = await getProduct('5');
    expect(p.sides_options.map((s) => s.is_active)).toEqual([true, true, false]);
  });
});
