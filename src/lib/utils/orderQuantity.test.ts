import { describe, expect, it } from 'vitest';
import {
  cardPreviewText, effectiveLimits, exampleText, formatQty, limitNotes, listingPreview, lowestTierQuantity,
  minOptionMultipliers, unitPaiseWithMultipliers, perPieceSuffix, pagePreviewText, tierForQuantity,
} from './orderQuantity';

const stickers = [
  { quantity: 50, price_per_unit: 6 }, { quantity: 100, price_per_unit: 4 },
  { quantity: 150, price_per_unit: 3.4 }, { quantity: 200, price_per_unit: 3 },
];
const tags = [{ quantity: 25, price_per_unit: 16 }, { quantity: 50, price_per_unit: 10 }, { quantity: 100, price_per_unit: 6.5 }];
const boards = [{ quantity: 1, price_per_unit: 1100 }, { quantity: 2, price_per_unit: 1000 }, { quantity: 3, price_per_unit: 900 }];
const auto = { listing: null, min: null, max: null };

describe('golden vectors for the three prod products (zero edits)', () => {
  it.each([
    ['stickers', stickers, '50 pcs for ₹300.00'],
    ['tags', tags, '25 pcs for ₹400.00'],
    ['boards', boards, '1 pc for ₹1,100.00'],
  ])('%s', (_n, tiers, expected) => {
    const eff = effectiveLimits(auto, tiers);
    const p = listingPreview(tiers, eff.listing, []);
    expect(p && cardPreviewText(p, 'pcs')).toBe(expected);
  });
});

describe('effective limits', () => {
  it('defaults min to the lowest tier, max to none, listing to min', () => {
    expect(effectiveLimits(auto, stickers)).toEqual({ min: 50, max: 1_000_000, hasMax: false, listing: 50 });
    expect(lowestTierQuantity([])).toBe(1);
  });
  it('honours stored overrides and clamps the listing', () => {
    expect(effectiveLimits({ listing: 100, min: 40, max: 500 }, stickers)).toEqual({ min: 40, max: 500, hasMax: true, listing: 100 });
    expect(effectiveLimits({ listing: 5, min: 40, max: 500 }, stickers).listing).toBe(40);
    expect(effectiveLimits({ listing: 900, min: 40, max: 500 }, stickers).listing).toBe(500);
  });
  it('moves the automatic defaults when tiers change', () => {
    expect(effectiveLimits(auto, [{ quantity: 10 }, ...stickers]).min).toBe(10);
  });
});

describe('tier lookup and pricing', () => {
  it('uses the highest tier at or below qty, else the lowest', () => {
    expect(tierForQuantity(stickers, 99)?.quantity).toBe(50);
    expect(tierForQuantity(stickers, 100)?.quantity).toBe(100);
    expect(tierForQuantity(stickers, 10)?.quantity).toBe(50);
  });
  it('prices a quantity below the lowest tier at the lowest tier rate', () => {
    const p = listingPreview(stickers, 40, []);
    expect(p?.totalPaise).toBe(24000);
    expect(p && cardPreviewText(p, 'pcs')).toBe('40 pcs for ₹240.00');
  });
  it('rounds the per-piece price HALF_UP after the option multiplier, then multiplies', () => {
    const p = listingPreview([{ quantity: 10, price_per_unit: 1.05 }], 10, [1.1]);
    expect(p?.unitPaise).toBe(116);
    expect(p?.totalPaise).toBe(1160);
  });
  it('shows MRP and percent only when the MRP exceeds the price', () => {
    const p = listingPreview([{ quantity: 40, price_per_unit: 6, mrp_per_unit: 7.5 }], 40, []);
    expect(p).toMatchObject({ mrpTotalPaise: 30000, percentOff: 20, totalPaise: 24000 });
    expect(listingPreview([{ quantity: 40, price_per_unit: 6, mrp_per_unit: 6 }], 40, [])?.mrpTotalPaise).toBeNull();
  });
  it('returns null for unpriced tiers', () => {
    expect(listingPreview([{ quantity: 40, price_per_unit: 0 }], 40, [])).toBeNull();
  });
  it('uses the smallest active multiplier per group', () => {
    expect(minOptionMultipliers([[{ price_multiplier: 1 }, { price_multiplier: 1.3 }], [{ price_multiplier: 0.5, is_active: false }, { price_multiplier: 2 }]])).toEqual([1, 2]);
  });
});

describe('preview strings', () => {
  const tiers = [{ quantity: 40, price_per_unit: 6 }];
  it('page line with and without a max', () => {
    const p = listingPreview(tiers, 40, []);
    if (!p) throw new Error('no preview');
    expect(pagePreviewText(p, 'pcs', effectiveLimits({ listing: null, min: null, max: 5000 }, tiers)))
      .toBe('opens at 40 pcs · ₹6.00/pc · total ₹240.00 · customers can order 40 to 5,000 pcs');
    expect(pagePreviewText(p, 'pcs', effectiveLimits(auto, tiers)))
      .toBe('opens at 40 pcs · ₹6.00/pc · total ₹240.00 · customers can order from 40 pcs');
  });
  it('singular only for pcs', () => {
    expect(formatQty(1, 'pcs')).toBe('1 pc');
    expect(formatQty(1, 'boards')).toBe('1 boards');
    expect(formatQty(1200, 'pcs')).toBe('1,200 pcs');
  });
});

describe('example column', () => {
  it('formats quantity x price in paise', () => {
    expect(exampleText(100, 4, null, 'pcs')).toBe('100 pcs = ₹400.00');
    expect(exampleText(3, 0.1, null, 'pcs')).toBe('3 pcs = ₹0.30');
    expect(exampleText(100, 4, 5, 'pcs')).toBe('100 pcs = ₹400.00 (MRP ₹500)');
  });
  it('is blank until quantity and price are valid', () => {
    expect(exampleText(0, 4, null, 'pcs')).toBeNull();
    expect(exampleText(NaN, 4, null, 'pcs')).toBeNull();
    expect(exampleText(100, 0, null, 'pcs')).toBeNull();
    expect(exampleText(1.5, 4, null, 'pcs')).toBeNull();
  });
});

describe('inline notes', () => {
  it('flags min below the lowest tier, unreachable tiers and mixed MRP', () => {
    const tiers = [{ quantity: 50, price_per_unit: 6, mrp_per_unit: 8 }, { quantity: 100, price_per_unit: 4 }];
    const n = limitNotes(tiers, effectiveLimits({ listing: null, min: 40, max: 80 }, tiers));
    expect(n.belowLowestTier).toBe('Orders of 40 to 49 pcs will be charged the 50+ rate (₹6/pc)');
    expect(n.unreachableTiers).toEqual(['Tier 100+ can never be reached (above the maximum)']);
    expect(n.mixedMrp).toBe(true);
  });
  it('is quiet for automatic limits', () => {
    const n = limitNotes(stickers, effectiveLimits(auto, stickers));
    expect(n).toEqual({ belowLowestTier: null, unreachableTiers: [], mixedMrp: false });
  });
});

describe('review fixes', () => {
  it('rounds once after multiplying by every multiplier (no per-step or 4-decimal rounding)', () => {
    expect(unitPaiseWithMultipliers(1.05, [1.1])).toBe(116);
    expect(unitPaiseWithMultipliers(1, [1.05, 1.05, 1.05])).toBe(116);
    expect(unitPaiseWithMultipliers(0.99, [1.0049])).toBe(99);
    expect(unitPaiseWithMultipliers(0.5, [1.01])).toBe(51);
    expect(unitPaiseWithMultipliers(2.5, [1.005])).toBe(251);
    expect(unitPaiseWithMultipliers(6, [])).toBe(600);
  });
  it('uses the storefront suffix rule', () => {
    expect(perPieceSuffix('pcs')).toBe('/pc');
    expect(perPieceSuffix('stickers')).toBe(' each');
    const t = [{ quantity: 40, price_per_unit: 6 }];
    const p = listingPreview(t, 40, []);
    if (!p) throw new Error('x');
    expect(pagePreviewText(p, 'stickers', effectiveLimits(auto, t))).toContain('₹6.00 each');
  });
  it('notes use the unit label and suffix', () => {
    const t = [{ quantity: 50, price_per_unit: 6 }];
    const n = limitNotes(t, effectiveLimits({ listing: null, min: 40, max: null }, t), 'stickers');
    expect(n.belowLowestTier).toBe('Orders of 40 to 49 stickers will be charged the 50+ rate (₹6 each)');
    const one = limitNotes([{ quantity: 2, price_per_unit: 6 }], effectiveLimits({ listing: null, min: 1, max: null }, [{ quantity: 2 }]));
    expect(one.belowLowestTier).toBe('Orders of 1 to 1 pc will be charged the 2+ rate (₹6/pc)');
  });
  it('groups quantities en-IN in previews and notes', () => {
    const t = [{ quantity: 100000, price_per_unit: 1 }];
    const p = listingPreview(t, 100000, []);
    if (!p) throw new Error('x');
    expect(cardPreviewText(p, 'pcs')).toBe('1,00,000 pcs for ₹1,00,000.00');
    expect(pagePreviewText(p, 'pcs', effectiveLimits({ listing: null, min: 1000, max: 100000 }, t))).toContain('customers can order 1,000 to 1,00,000 pcs');
    const n = limitNotes([{ quantity: 100000, price_per_unit: 1 }], effectiveLimits({ listing: null, min: 1000, max: 5000 }, t));
    expect(n.belowLowestTier).toContain('Orders of 1,000 to 99,999 pcs will be charged the 1,00,000+ rate');
    expect(n.unreachableTiers).toEqual(['Tier 1,00,000+ can never be reached (above the maximum)']);
  });
});
