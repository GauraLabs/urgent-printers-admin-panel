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
