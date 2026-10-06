import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICE_MISMATCH_FILTERS,
  buildPriceMismatchParams,
  normalisePriceMismatch,
  normalisePriceMismatchPage,
  normalisePriceMismatchSummary,
  type RawPriceMismatch,
} from './priceMismatches';

const raw: RawPriceMismatch = {
  id: 9, created_at: '2026-10-03T08:15:00Z', stage: 'preview', user_id: 3, product_id: 4,
  product_slug: 'cards', quantity: 100, options: { paper: 1 },
  client_unit: '1.50', server_unit: 1.6, client_mrp: null, server_mrp: undefined,
  client_total: 150, server_total: 160, diff_total: null,
  likely_cause: 'unexplained', context: null, resolved_at: null, resolved_by: null, note: null,
};

describe('normalisePriceMismatch', () => {
  it('stringifies ids and keeps null numbers null', () => {
    const n = normalisePriceMismatch(raw);
    expect(n.id).toBe('9');
    expect(n.product_id).toBe('4');
    expect(n.user_id).toBe('3');
    expect(n.client_unit).toBe(1.5);
    expect(n.client_mrp).toBeNull();
    expect(n.server_mrp).toBeNull();
    expect(n.diff_total).toBeNull();
    expect(n.context).toEqual({ added_at_source: null });
  });
  it('handles a missing product and guest user', () => {
    const n = normalisePriceMismatch({ ...raw, product_id: null, user_id: undefined, product_slug: null });
    expect(n.product_id).toBeNull();
    expect(n.user_id).toBeNull();
    expect(n.product_slug).toBeNull();
  });
  it('maps resolved_by id to string and unknown causes to unexplained', () => {
    const n = normalisePriceMismatch({ ...raw, likely_cause: 'weird', resolved_by: { id: 5, name: 'Asha' } });
    expect(n.resolved_by).toEqual({ id: '5', name: 'Asha' });
    expect(n.likely_cause).toBe('unexplained');
  });
  it('normalises added_at_source, defaulting missing or unknown to null', () => {
    const src = (c: RawPriceMismatch['context']) => normalisePriceMismatch({ ...raw, context: c }).context.added_at_source;
    expect(src({ added_at_source: 'client' } as never)).toBe('client');
    expect(src({ added_at_source: 'server_cart' } as never)).toBe('server_cart');
    expect(src({ request_id: 'r' } as never)).toBeNull();
    expect(src({ added_at_source: 'bogus' } as never)).toBeNull();
  });
  it('treats non-numeric strings as null', () => {
    expect(normalisePriceMismatch({ ...raw, client_total: 'abc' }).client_total).toBeNull();
  });
  it('normalises a page', () => {
    const p = normalisePriceMismatchPage({ items: [raw], total: 1, offset: 0, limit: 25 });
    expect(p.items[0].id).toBe('9');
    expect(p.total).toBe(1);
  });
});

describe('normalisePriceMismatchSummary', () => {
  it('fills missing causes with 0', () => {
    const s = normalisePriceMismatchSummary({ by_cause: { unexplained: 2 }, unexplained_unresolved: 1 });
    expect(s.by_cause).toEqual({ product_updated: 0, discount_window_boundary: 0, price_changed_at_checkout: 0, unexplained: 2 });
    expect(s.last_unexplained_at).toBeNull();
  });
});

describe('default filters and params', () => {
  it('defaults to unexplained + unresolved', () => {
    expect(DEFAULT_PRICE_MISMATCH_FILTERS.cause).toBe('unexplained');
    expect(DEFAULT_PRICE_MISMATCH_FILTERS.resolved).toBe('unresolved');
    expect(buildPriceMismatchParams(DEFAULT_PRICE_MISMATCH_FILTERS)).toEqual({
      offset: 0, limit: 25, cause: 'unexplained', resolved: false,
    });
  });
  it('omits "all" filters and sends IST day bounds as UTC', () => {
    const p = buildPriceMismatchParams({
      cause: 'all', stage: 'order_create', resolved: 'all', fromDate: '2026-10-01', toDate: '2026-10-02', offset: 25,
    });
    expect(p).toEqual({
      offset: 25, limit: 25, stage: 'order_create',
      from: '2026-09-30T18:30:00.000Z', to: '2026-10-02T18:29:00.000Z',
    });
  });
  it('sends resolved=true for resolved', () => {
    expect(buildPriceMismatchParams({ ...DEFAULT_PRICE_MISMATCH_FILTERS, resolved: 'resolved' }).resolved).toBe(true);
  });
});
