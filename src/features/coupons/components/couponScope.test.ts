import { describe, expect, it } from 'vitest';
import { couponScopeSummary } from './couponScope';

describe('couponScopeSummary', () => {
  it.each([
    [[], [], 'All products'],
    [['1'], [], '1 product'],
    [['1', '2', '3'], ['4'], '3 products and 1 category'],
    [[], ['4', '5'], '2 categories'],
  ])('%j %j -> %s', (p, c, want) => {
    expect(couponScopeSummary(p, c)).toBe(want);
  });
});
