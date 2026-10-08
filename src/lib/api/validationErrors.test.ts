import { describe, expect, it } from 'vitest';
import {
  codedErrorMessage, describeApiError, formatValidationDetail, humanizePath, parseValidationDetail, quantityLimitFieldFromMessage,
} from './validationErrors';

const DETAIL = [
  { loc: ['body', 'pricing_tiers', 0, 'price_per_unit'], msg: 'Value error, price too high', type: 'value_error' },
  { loc: ['body', 'name'], msg: 'String should have at most 255 characters', type: 'string_too_long' },
];

describe('validation detail mapping', () => {
  it('maps loc to a dotted path without the body prefix', () => {
    expect(parseValidationDetail(DETAIL)).toEqual([
      { path: 'pricing_tiers.0.price_per_unit', message: 'price too high' },
      { path: 'name', message: 'String should have at most 255 characters' },
    ]);
  });
  it('humanises paths with 1-based indexes', () => {
    expect(humanizePath('pricing_tiers.0.price_per_unit')).toBe('Pricing tiers #1 price per unit');
    expect(humanizePath('turnaround_options.2.extra_cost')).toBe('Turnaround options #3 extra cost');
  });
  it('formats a readable single string', () => {
    expect(formatValidationDetail(DETAIL)).toBe(
      'Pricing tiers #1 price per unit: price too high; Name: String should have at most 255 characters',
    );
  });
  it('passes plain string details through and ignores junk', () => {
    expect(formatValidationDetail('Slug in use')).toBe('Slug in use');
    expect(formatValidationDetail(undefined)).toBeUndefined();
    expect(parseValidationDetail([null, 3, {}])).toEqual([]);
  });
});

describe('coded error mapping', () => {
  it.each([
    'invalid_coupon_value', 'invalid_option', 'invalid_turnaround', 'product_unavailable', 'invalid_order_total', 'invalid_mrp', 'product_unpriceable',
  ])('has a friendly message for %s', (code) => {
    expect(codedErrorMessage(code)).toBeTruthy();
    expect(describeApiError({ status: 422, code, message: 'raw' }, 'fallback')).not.toBe('raw');
  });
  it('falls back to server message on 422/409 and to the fallback otherwise', () => {
    expect(describeApiError({ status: 422, message: 'Slug in use' }, 'fb')).toBe('Slug in use');
    expect(describeApiError({ status: 500, message: 'boom' }, 'fb')).toBe('fb');
    expect(codedErrorMessage(undefined)).toBeUndefined();
  });
});

describe('quantity limit error codes', () => {
  it('maps the new codes to friendly messages and drops the pack codes', () => {
    expect(codedErrorMessage('quantity_limits_invalid')).toMatch(/minimum cannot exceed the maximum/);
    expect(codedErrorMessage('quantity_below_minimum')).toMatch(/below the minimum/);
    expect(codedErrorMessage('quantity_above_maximum')).toMatch(/above the maximum/);
    expect(codedErrorMessage('pack_size_tier_mismatch')).toBeUndefined();
    expect(codedErrorMessage('invalid_pack_multiple')).toBeUndefined();
  });
  it('picks the field named in a quantity_limits_invalid message', () => {
    expect(quantityLimitFieldFromMessage('Minimum order cannot be more than the maximum')).toBe('min_order_quantity');
    expect(quantityLimitFieldFromMessage('Show-on-listing quantity must be between the minimum (40) and the maximum (500)')).toBe('listing_quantity');
    expect(quantityLimitFieldFromMessage('Maximum order must be at most 1,000,000')).toBe('max_order_quantity');
  });
});

describe('invalid_coupon_scope', () => {
  it('maps to a friendly message', () => {
    expect(codedErrorMessage('invalid_coupon_scope')).toMatch(/no longer exist/);
    expect(describeApiError({ code: 'invalid_coupon_scope', status: 422, message: 'raw' }, 'fb')).toMatch(/Applies to/);
  });
});
