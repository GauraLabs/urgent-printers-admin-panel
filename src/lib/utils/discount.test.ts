import { describe, expect, it } from 'vitest';
import { discountAmount, discountPercent, displayDiscountPercent, priceForPercentOff, toPaise } from './discount';

// Golden vectors from the MRP discount spec, section 1.2 (shared with backend and storefront).
const GOLDEN: Array<[number, number, number]> = [
  [12.0, 9.0, 25],
  [3.0, 2.0, 33],
  [7.0, 6.5, 7],
  [200.0, 199.0, 1],
  [1000.0, 996.0, 0],
  [10.0, 5.5, 45],
];

describe('discountPercent (golden vectors)', () => {
  it.each(GOLDEN)('mrp %s price %s -> %s%%', (mrp, price, pct) => {
    expect(discountPercent(mrp, price)).toBe(pct);
  });

  it('rounds the 0.5 boundary half up (200 vs 199 is 1, not 0)', () => {
    expect(discountPercent(200, 199)).toBe(1);
  });

  it('is 0 for non-discounts', () => {
    expect(discountPercent(10, 10)).toBe(0);
    expect(discountPercent(10, 12)).toBe(0);
    expect(discountPercent(10, 0)).toBe(0);
    expect(discountPercent(0, 5)).toBe(0);
  });
});

describe('displayDiscountPercent', () => {
  it('hides the badge at 0%', () => {
    expect(displayDiscountPercent(1000, 996)).toBeNull();
  });
  it('hides when there is no MRP', () => {
    expect(displayDiscountPercent(null, 9)).toBeNull();
    expect(displayDiscountPercent(undefined, 9)).toBeNull();
  });
  it('returns the integer otherwise', () => {
    expect(displayDiscountPercent(12, 9)).toBe(25);
  });
});

describe('priceForPercentOff', () => {
  it('computes in paise with HALF_UP', () => {
    expect(priceForPercentOff(12, 25)).toBe(9);
    expect(priceForPercentOff(7, 25)).toBe(5.25);
    expect(priceForPercentOff(10, 45)).toBe(5.5);
    expect(priceForPercentOff(0.99, 50)).toBe(0.5);
    expect(priceForPercentOff(100, 12.5)).toBe(87.5);
  });
});

describe('helpers', () => {
  it('toPaise is float-safe', () => {
    expect(toPaise(0.1 + 0.2)).toBe(30);
    expect(toPaise(1.005)).toBe(101);
  });
  it('discountAmount is exact to the paisa', () => {
    expect(discountAmount(12, 9)).toBe(3);
    expect(discountAmount(7, 6.5)).toBe(0.5);
    expect(discountAmount(5, 5)).toBe(0);
  });
});
