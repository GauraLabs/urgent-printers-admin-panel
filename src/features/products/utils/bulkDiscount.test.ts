import { describe, expect, it } from 'vitest';
import { buildBulkParams, describeSkipReason, validateBulkInput, type BulkInput } from './bulkDiscount';

const base: BulkInput = {
  action: 'apply', scopeMode: 'selected', selectedIds: ['1', '2'], categoryId: '',
  percent: '20', startsAtLocal: '', endsAtLocal: '', overwriteExisting: false,
};
const now = new Date('2026-10-03T00:00:00Z');

describe('validateBulkInput', () => {
  it('accepts a valid apply', () => expect(validateBulkInput(base, now)).toEqual({}));
  it('requires scope', () => {
    expect(validateBulkInput({ ...base, selectedIds: [] }, now).scope).toBeDefined();
    expect(validateBulkInput({ ...base, scopeMode: 'category' }, now).scope).toBeDefined();
  });
  it('caps at 500 products', () => {
    const ids = Array.from({ length: 501 }, (_, i) => String(i));
    expect(validateBulkInput({ ...base, selectedIds: ids }, now).scope).toBeDefined();
  });
  it.each(['', '0', '100', '-5', '12.345', 'abc'])('rejects percent %j', (percent) => {
    expect(validateBulkInput({ ...base, percent }, now).percent).toBeDefined();
  });
  it('accepts two decimals', () => expect(validateBulkInput({ ...base, percent: '12.5' }, now)).toEqual({}));
  it('rejects end before start and end in the past', () => {
    expect(validateBulkInput({ ...base, startsAtLocal: '2030-02-01T10:00', endsAtLocal: '2030-01-01T10:00' }, now).ends_at).toBeDefined();
    expect(validateBulkInput({ ...base, endsAtLocal: '2026-10-02T10:00' }, now).ends_at).toBeDefined();
  });
  it('ignores percent and window for clear', () => {
    expect(validateBulkInput({ ...base, action: 'clear', percent: '', endsAtLocal: '2020-01-01T00:00' }, now)).toEqual({});
  });
});

describe('buildBulkParams', () => {
  it('sends numeric ids, percent and UTC ISO window', () => {
    expect(buildBulkParams({ ...base, startsAtLocal: '2030-01-01T10:00', endsAtLocal: '2030-01-02T10:00', overwriteExisting: true })).toEqual({
      action: 'apply',
      scope: { product_ids: [1, 2], category_id: null },
      percent: 20,
      starts_at: '2030-01-01T04:30:00.000Z',
      ends_at: '2030-01-02T04:30:00.000Z',
      overwrite_existing: true,
    });
  });
  it('category scope and clear', () => {
    expect(buildBulkParams({ ...base, action: 'clear', scopeMode: 'category', categoryId: '7' })).toEqual({
      action: 'clear', scope: { product_ids: null, category_id: 7 }, percent: null, starts_at: null, ends_at: null, overwrite_existing: false,
    });
  });
});

describe('describeSkipReason', () => {
  it.each([
    'no_change', 'no_eligible_tiers', 'no_discount', 'price_out_of_range', 'invalid_price', 'product_missing', 'modified_since', 'archived',
  ])('has a curated label for %s', (code) => {
    expect(describeSkipReason(code)).not.toBe(code.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()));
  });
  it('humanises unknown codes', () => expect(describeSkipReason('some_new_reason')).toBe('Some new reason'));
});
