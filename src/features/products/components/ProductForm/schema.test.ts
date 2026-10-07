import { describe, expect, it } from 'vitest';
import { buildProductPayload, getWindowEndInPastError, productSchema, type ProductFormValues } from './schema';

function baseValues(over: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    name: 'Cards', slug: 'cards', short_description: 'x', category_id: '3', status: 'draft',
    pricing_tiers: [
      { quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false },
      { quantity: 500, price_per_unit: 7, mrp_per_unit: null, is_best_value: true },
    ],
    customization_mode: 'none',
    ...over,
  };
}

describe('product zod schema: mrp_per_unit retention (strip regression)', () => {
  it('keeps mrp_per_unit on every tier after parsing', () => {
    const parsed = productSchema.parse(baseValues());
    expect(parsed.pricing_tiers[0].mrp_per_unit).toBe(12);
    expect(parsed.pricing_tiers[1].mrp_per_unit).toBeNull();
    expect(Object.keys(parsed.pricing_tiers[0])).toContain('mrp_per_unit');
  });

  it('keeps the window keys', () => {
    const parsed = productSchema.parse(baseValues({
      discount_starts_at: '2030-01-01T00:00:00.000Z', discount_ends_at: '2030-02-01T00:00:00.000Z',
    }));
    expect(parsed.discount_starts_at).toBe('2030-01-01T00:00:00.000Z');
    expect(parsed.discount_ends_at).toBe('2030-02-01T00:00:00.000Z');
  });
});

describe('product zod schema: refines', () => {
  it('rejects MRP below the selling price', () => {
    const r = productSchema.safeParse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 8, is_best_value: false }],
    }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(['pricing_tiers', 0, 'mrp_per_unit']);
  });

  it('accepts MRP equal to the price (backend normalises it to null)', () => {
    expect(productSchema.safeParse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 9, is_best_value: false }],
    })).success).toBe(true);
  });

  it('rejects an MRP with a zero selling price', () => {
    expect(productSchema.safeParse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 0, mrp_per_unit: 5, is_best_value: false }],
    })).success).toBe(false);
  });

  it('rejects a non-positive MRP', () => {
    expect(productSchema.safeParse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 0, is_best_value: false }],
    })).success).toBe(false);
  });

  it('rejects end before start', () => {
    const r = productSchema.safeParse(baseValues({
      discount_starts_at: '2030-02-01T00:00:00.000Z', discount_ends_at: '2030-01-01T00:00:00.000Z',
    }));
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path.join('.') === 'discount_ends_at')).toBe(true);
  });

  it('rejects end equal to start', () => {
    expect(productSchema.safeParse(baseValues({
      discount_starts_at: '2030-01-01T00:00:00.000Z', discount_ends_at: '2030-01-01T00:00:00.000Z',
    })).success).toBe(false);
  });

  it('rejects a window when no tier has an MRP', () => {
    const r = productSchema.safeParse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: null, is_best_value: false }],
      discount_ends_at: '2030-01-01T00:00:00.000Z',
    }));
    expect(r.success).toBe(false);
  });
});

describe('getWindowEndInPastError', () => {
  const now = new Date('2026-10-03T00:00:00Z');
  it('flags a new end in the past', () => {
    expect(getWindowEndInPastError({ discount_ends_at: '2026-10-02T00:00:00Z' }, undefined, now)).not.toBeNull();
  });
  it('flags a changed end in the past on edit', () => {
    expect(getWindowEndInPastError(
      { discount_ends_at: '2026-10-02T00:00:00Z' },
      { discount_starts_at: null, discount_ends_at: '2030-01-01T00:00:00Z' }, now,
    )).not.toBeNull();
  });
  it('does not flag an unchanged (already ended) window', () => {
    expect(getWindowEndInPastError(
      { discount_ends_at: '2026-10-02T00:00:00.000Z' },
      { discount_starts_at: null, discount_ends_at: '2026-10-02T00:00:00Z' }, now,
    )).toBeNull();
  });
  it('allows clearing', () => {
    expect(getWindowEndInPastError({ discount_ends_at: null }, undefined, now)).toBeNull();
  });
});

describe('buildProductPayload (PATCH body)', () => {
  it('sends mrp_per_unit explicitly on every tier, null when blank', () => {
    const body = buildProductPayload(baseValues(), 'active', { discount_starts_at: null, discount_ends_at: null });
    expect(body.pricing_tiers).toEqual([
      { quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false },
      { quantity: 500, price_per_unit: 7, mrp_per_unit: null, is_best_value: true },
    ]);
    for (const t of body.pricing_tiers) expect(t).toHaveProperty('mrp_per_unit');
  });

  it('survives a parse round trip (what the form actually submits)', () => {
    const parsed = productSchema.parse(baseValues({
      pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 12, discount_percent: 25, discount_per_unit: 3, is_best_value: false }],
    }));
    const body = buildProductPayload(parsed, 'active', { discount_starts_at: null, discount_ends_at: null });
    expect(body.pricing_tiers[0]).toEqual({ quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false });
  });

  it('coerces an undefined mrp to null', () => {
    const v = baseValues({ pricing_tiers: [{ quantity: 1, price_per_unit: 5, is_best_value: false }] });
    expect(buildProductPayload(v, 'draft').pricing_tiers[0].mrp_per_unit).toBeNull();
  });

  it('omits the window keys when unchanged on edit', () => {
    const v = baseValues({ discount_starts_at: '2030-01-01T00:00:00.000Z', discount_ends_at: '2030-02-01T00:00:00.000Z' });
    const body = buildProductPayload(v, 'active', { discount_starts_at: '2030-01-01T00:00:00Z', discount_ends_at: '2030-02-01T00:00:00Z' });
    expect(body).not.toHaveProperty('discount_starts_at');
    expect(body).not.toHaveProperty('discount_ends_at');
  });

  it('sends only the changed window key on edit, and null to clear', () => {
    const original = { discount_starts_at: '2030-01-01T00:00:00Z', discount_ends_at: '2030-02-01T00:00:00Z' };
    const changed = buildProductPayload(
      baseValues({ discount_starts_at: '2030-01-01T00:00:00.000Z', discount_ends_at: '2030-03-01T00:00:00.000Z' }), 'active', original);
    expect(changed).not.toHaveProperty('discount_starts_at');
    expect(changed.discount_ends_at).toBe('2030-03-01T00:00:00.000Z');

    const cleared = buildProductPayload(baseValues({ discount_starts_at: null, discount_ends_at: null }), 'active', original);
    expect(cleared.discount_starts_at).toBeNull();
    expect(cleared.discount_ends_at).toBeNull();
  });

  it('on create sends only a window that exists', () => {
    expect(buildProductPayload(baseValues(), 'draft')).not.toHaveProperty('discount_ends_at');
    const body = buildProductPayload(baseValues({ discount_ends_at: '2030-01-01T00:00:00.000Z' }), 'draft');
    expect(body.discount_ends_at).toBe('2030-01-01T00:00:00.000Z');
    expect(body).not.toHaveProperty('discount_starts_at');
  });
});

import { getTierPriceTypoWarnings, sortTiersByQuantity, collectFieldErrors } from './schema';

const tierOf = (over: Partial<ProductFormValues['pricing_tiers'][number]>) => ({
  quantity: 100, price_per_unit: 9, mrp_per_unit: null, is_best_value: false, ...over,
});

function issuePaths(values: Partial<ProductFormValues>): string[] {
  const r = productSchema.safeParse(baseValues(values));
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('pricing bounds', () => {
  it.each([
    ['price 0', { price_per_unit: 0 }],
    ['price 0.001', { price_per_unit: 0.001 }],
    ['price over 100000', { price_per_unit: 100001 }],
    ['price with 3 decimals', { price_per_unit: 1.005 }],
    ['negative price', { price_per_unit: -1 }],
  ])('rejects %s', (_n, over) => {
    expect(issuePaths({ pricing_tiers: [tierOf(over)] })).toContain('pricing_tiers.0.price_per_unit');
  });

  it.each([0.01, 100000, 12.34])('accepts price %s', (price) => {
    expect(issuePaths({ pricing_tiers: [tierOf({ price_per_unit: price })] })).toEqual([]);
  });

  it('rejects MRP over 100000, with 3 decimals, and over 10x the price', () => {
    expect(issuePaths({ pricing_tiers: [tierOf({ price_per_unit: 50000, mrp_per_unit: 100001 })] })).toContain('pricing_tiers.0.mrp_per_unit');
    expect(issuePaths({ pricing_tiers: [tierOf({ mrp_per_unit: 12.345 })] })).toContain('pricing_tiers.0.mrp_per_unit');
    expect(issuePaths({ pricing_tiers: [tierOf({ price_per_unit: 9, mrp_per_unit: 90.01 })] })).toContain('pricing_tiers.0.mrp_per_unit');
  });

  it('accepts MRP exactly 10x the price', () => {
    expect(issuePaths({ pricing_tiers: [tierOf({ price_per_unit: 9, mrp_per_unit: 90 })] })).toEqual([]);
  });

  it.each([0, -5, 1.5, 1_000_001, 10_000_000])('rejects quantity %s', (quantity) => {
    expect(issuePaths({ pricing_tiers: [tierOf({ quantity })] })).toContain('pricing_tiers.0.quantity');
  });

  it('accepts quantity bounds 1 and 1,000,000', () => {
    expect(issuePaths({ pricing_tiers: [tierOf({ quantity: 1 }), tierOf({ quantity: 1_000_000 })] })).toEqual([]);
  });

  it('rejects duplicate quantities on the later tier', () => {
    const paths = issuePaths({ pricing_tiers: [tierOf({ quantity: 100 }), tierOf({ quantity: 500 }), tierOf({ quantity: 100 })] });
    expect(paths).toEqual(['pricing_tiers.2.quantity']);
  });

  it('rejects NaN (blank number input) with a readable message', () => {
    const r = productSchema.safeParse(baseValues({ pricing_tiers: [tierOf({ price_per_unit: NaN })] }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Price must be a number');
  });
});

describe('option and field bounds', () => {
  const size = (m: number) => ({ label: 'A4', width: 1, height: 1, unit: 'mm' as const, is_active: true, is_default: true, price_multiplier: m });

  it.each([0, 0.009, 100.01, 1.00001])('rejects multiplier %s on sizes', (m) => {
    expect(issuePaths({ sizes: [size(m)] })).toContain('sizes.0.price_multiplier');
  });
  it.each([0.01, 100, 1.2345])('accepts multiplier %s', (m) => {
    expect(issuePaths({ sizes: [size(m)] })).toEqual([]);
  });
  it('applies to paper, finishes and sides too', () => {
    expect(issuePaths({ paper_types: [{ label: 'p', gsm: 1, is_active: true, is_default: true, price_multiplier: 0 }] })).toContain('paper_types.0.price_multiplier');
    expect(issuePaths({ finishes: [{ label: 'f', is_active: true, is_default: true, price_multiplier: 101 }] })).toContain('finishes.0.price_multiplier');
    expect(issuePaths({ sides_options: [{ label: 's', is_active: true, is_default: true, price_multiplier: 0 }] })).toContain('sides_options.0.price_multiplier');
  });
  it.each([-1, 100001])('rejects turnaround extra_cost %s', (extra_cost) => {
    expect(issuePaths({ turnaround_options: [{ type: 'standard', days: 5, extra_cost, is_active: true }] })).toContain('turnaround_options.0.extra_cost');
  });
  it('accepts turnaround extra_cost 0 and 100000', () => {
    expect(issuePaths({ turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }, { type: 'rush', days: 1, extra_cost: 100000, is_active: true }] })).toEqual([]);
  });
  it('limits name and slug to 255 characters', () => {
    expect(issuePaths({ name: 'x'.repeat(256) })).toContain('name');
    expect(issuePaths({ slug: 'x'.repeat(256) })).toContain('slug');
    expect(issuePaths({ name: 'x'.repeat(255), slug: 'x'.repeat(255) })).toEqual([]);
  });
});

describe('tier ordering and typo warning', () => {
  it('sorts by quantity and does not mutate the input', () => {
    const input = [{ quantity: 500 }, { quantity: 100 }, { quantity: 250 }];
    expect(sortTiersByQuantity(input).map((t) => t.quantity)).toEqual([100, 250, 500]);
    expect(input[0].quantity).toBe(500);
  });
  it('payload tiers are sorted by quantity', () => {
    const body = buildProductPayload(baseValues({ pricing_tiers: [tierOf({ quantity: 500 }), tierOf({ quantity: 100 })] }), 'draft');
    expect(body.pricing_tiers.map((t) => t.quantity)).toEqual([100, 500]);
  });
  it('warns when neighbouring tiers differ by more than 10x (either direction)', () => {
    const w = getTierPriceTypoWarnings([
      { quantity: 100, price_per_unit: 5 }, { quantity: 500, price_per_unit: 4 }, { quantity: 1000, price_per_unit: 400 },
    ]);
    expect(w).toHaveLength(1);
    expect(w[0].index).toBe(2);
    expect(getTierPriceTypoWarnings([{ quantity: 100, price_per_unit: 400 }, { quantity: 500, price_per_unit: 4 }])).toHaveLength(1);
  });
  it('uses quantity order, not array order, for neighbours', () => {
    expect(getTierPriceTypoWarnings([
      { quantity: 1000, price_per_unit: 4 }, { quantity: 100, price_per_unit: 5 }, { quantity: 500, price_per_unit: 4.5 },
    ])).toEqual([]);
  });
  it('does not warn at exactly 10x or on a single tier', () => {
    expect(getTierPriceTypoWarnings([{ quantity: 1, price_per_unit: 1 }, { quantity: 2, price_per_unit: 10 }])).toEqual([]);
    expect(getTierPriceTypoWarnings([{ quantity: 1, price_per_unit: 1 }])).toEqual([]);
  });
});

describe('collectFieldErrors', () => {
  it('flattens nested RHF errors', () => {
    const errs = { name: { type: 'x', message: 'bad name' }, pricing_tiers: [{ price_per_unit: { type: 'y', message: 'bad price' } }] };
    expect(collectFieldErrors(errs)).toEqual([
      { path: 'name', message: 'bad name' },
      { path: 'pricing_tiers.0.price_per_unit', message: 'bad price' },
    ]);
  });
});

describe('integer limits', () => {
  it('stock and threshold: whole numbers up to 2,147,483,647', () => {
    expect(issuePaths({ stock_quantity: 1.5 })).toContain('stock_quantity');
    expect(issuePaths({ stock_quantity: 2_147_483_648 })).toContain('stock_quantity');
    expect(issuePaths({ low_stock_threshold: 2_147_483_648 })).toContain('low_stock_threshold');
    expect(issuePaths({ stock_quantity: 2_147_483_647, low_stock_threshold: 0 })).toEqual([]);
    expect(issuePaths({ stock_quantity: null })).toEqual([]);
  });
});

import { getCheapestUnitPrice } from './schema';

describe('product_unpriceable client-side check', () => {
  const m = (price_multiplier: number, is_active = true) => ({ price_multiplier, is_active });

  it('flags when min tier price x min active multipliers is below 0.005', () => {
    const paths = issuePaths({
      pricing_tiers: [tierOf({ quantity: 100, price_per_unit: 9 }), tierOf({ quantity: 500, price_per_unit: 0.01 })],
      paper_types: [{ label: 'p', gsm: 1, is_active: true, is_default: true, price_multiplier: 0.1 }],
      finishes: [{ label: 'f', is_active: true, is_default: true, price_multiplier: 0.1 }],
    });
    expect(paths).toContain('pricing_tiers.1.price_per_unit');
  });

  it('ignores inactive options and accepts exactly the 0.005 boundary', () => {
    expect(getCheapestUnitPrice({ pricing_tiers: [{ price_per_unit: 0.01 }], sizes: [m(0.01, false), m(1)] })?.price).toBe(0.01);
    expect(issuePaths({
      pricing_tiers: [tierOf({ price_per_unit: 0.01 })],
      sizes: [{ label: 'a', width: 1, height: 1, unit: 'mm', is_active: true, is_default: true, price_multiplier: 0.5 }],
    })).toEqual([]);
  });

  it('does not flag ordinary pricing', () => {
    expect(issuePaths({})).toEqual([]);
  });
});

describe('sides is_active in the payload', () => {
  it('is sent for each sides option', () => {
    const body = buildProductPayload(baseValues({
      sides_options: [{ label: 'Single', is_active: true, is_default: true, price_multiplier: 1 }, { label: 'Double', is_active: false, is_default: false, price_multiplier: 1.35 }],
    }), 'draft');
    expect(body.sides_options.map((s) => s.is_active)).toEqual([true, false]);
  });
});


describe('order quantity limits: schema and payload', () => {
  const issues = (over: Partial<ProductFormValues>) =>
    productSchema.safeParse(baseValues(over)).error?.issues.map((i) => `${i.path.join('.')}|${i.message}`) ?? [];

  it('accepts all-automatic limits (null or omitted)', () => {
    expect(issues({})).toEqual([]);
    expect(issues({ listing_quantity: null, min_order_quantity: null, max_order_quantity: null })).toEqual([]);
  });

  it('rejects non-integers and out-of-range values with the shared message', () => {
    for (const key of ['listing_quantity', 'min_order_quantity'] as const) {
      expect(issues({ [key]: 0 }).some((m) => m.startsWith(`${key}|Enter a whole number from 1 to 1,000,000`))).toBe(true);
      expect(issues({ [key]: 2.5 }).some((m) => m.startsWith(`${key}|`))).toBe(true);
      expect(issues({ [key]: 1_000_001 }).some((m) => m.startsWith(`${key}|`))).toBe(true);
    }
    expect(issues({ max_order_quantity: 1_000_001 })).toContain('max_order_quantity|Maximum order must be at most 1,000,000');
  });

  it('rejects min above max', () => {
    expect(issues({ min_order_quantity: 500, max_order_quantity: 100 })).toContain('min_order_quantity|Minimum order cannot be more than the maximum');
  });

  it('rejects an automatic min (lowest tier 100) above a set max', () => {
    expect(issues({ max_order_quantity: 50 }).some((m) => m.startsWith('max_order_quantity|Minimum order cannot'))).toBe(true);
  });

  it('rejects a listing quantity outside the effective range', () => {
    expect(issues({ listing_quantity: 50 })).toContain('listing_quantity|Show-on-listing quantity must be between 100 and 10,00,000');
    expect(issues({ min_order_quantity: 40, max_order_quantity: 500, listing_quantity: 600 })).toContain('listing_quantity|Show-on-listing quantity must be between 40 and 500');
    expect(issues({ min_order_quantity: 40, max_order_quantity: 500, listing_quantity: 40 })).toEqual([]);
  });

  it('allows min below the lowest tier', () => {
    expect(issues({ min_order_quantity: 10 })).toEqual([]);
  });

  it('sends nulls for automatic limits and never sends pack_size or quantity_steps', () => {
    const p = buildProductPayload(baseValues(), 'draft');
    expect(p.listing_quantity).toBeNull();
    expect(p.min_order_quantity).toBeNull();
    expect(p.max_order_quantity).toBeNull();
    expect('pack_size' in p).toBe(false);
    expect('quantity_steps' in p).toBe(false);
    expect(p.unit_label).toBe('pcs');
  });

  it('sends explicit limits', () => {
    const p = buildProductPayload(baseValues({ listing_quantity: 200, min_order_quantity: 100, max_order_quantity: 5000, unit_label: ' stickers ' }), 'draft');
    expect([p.listing_quantity, p.min_order_quantity, p.max_order_quantity, p.unit_label]).toEqual([200, 100, 5000, 'stickers']);
  });

  it('validates the unit label format', () => {
    expect(issues({ unit_label: '' }).some((m) => m.startsWith('unit_label|'))).toBe(true);
    expect(issues({ unit_label: '1pcs' }).some((m) => m.startsWith('unit_label|'))).toBe(true);
    expect(issues({ unit_label: 'x'.repeat(31) }).some((m) => m.startsWith('unit_label|'))).toBe(true);
    expect(issues({ unit_label: 'sq. ft/rolls-2' })).toEqual([]);
  });
});
