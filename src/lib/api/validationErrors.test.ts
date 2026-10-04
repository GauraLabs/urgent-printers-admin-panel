import { describe, expect, it } from 'vitest';
import {
  codedErrorMessage, describeApiError, formatValidationDetail, humanizePath, parseValidationDetail,
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
