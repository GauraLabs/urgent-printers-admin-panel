import type { MismatchCause, RawPriceMismatch, RawPriceMismatchSummary } from '../priceMismatches';

// Shapes mirror real backend samples: numeric ids, float amounts, null option values,
// fractional-second and +00:00 timestamps, and order_create rows with null product fields.
const base = (n: number, cause: MismatchCause, extra: Partial<RawPriceMismatch> = {}): RawPriceMismatch => ({
  id: n,
  created_at: '2026-10-04T12:30:11.512345Z',
  stage: 'preview',
  user_id: 21445,
  product_id: 27580,
  product_slug: 'business-cards',
  quantity: 100,
  options: { size_id: 'std', paper_id: '300gsm', finish_id: null, sides: 'Double', turnaround_id: 'standard' },
  client_unit: 4.0,
  server_unit: 5.0,
  client_mrp: null,
  server_mrp: null,
  client_total: 400.0,
  server_total: 500.0,
  diff_total: -100.0,
  likely_cause: cause,
  context: {
    user_agent: 'Mozilla/5.0 ...',
    request_id: `req-${n}`,
    added_at: '2026-09-14T09:00:00+00:00',
    added_at_source: 'server_cart',
  },
  resolved_at: null,
  resolved_by: null,
  note: null,
  ...extra,
});

export const FIXTURE_ITEMS: RawPriceMismatch[] = [
  base(1, 'unexplained'),
  base(2, 'unexplained', { stage: 'order_create', client_total: 530.0, server_total: 500.0, diff_total: 30.0 }),
  base(3, 'product_updated'),
  base(4, 'discount_window_boundary', { client_mrp: 6.0, server_mrp: 6.0 }),
  base(5, 'price_changed_at_checkout', {
    stage: 'order_create', product_id: null, product_slug: null, quantity: null, options: {},
    context: { request_id: 'req-5', added_at_source: null },
  }),
  base(6, 'unexplained', {
    resolved_at: '2026-10-04T12:45:00+00:00',
    resolved_by: { id: 1, name: 'Asha' },
    note: 'Rounding on tier boundary',
  }),
];

export function fixtureSummary(): RawPriceMismatchSummary {
  return {
    by_cause: { unexplained: 4, product_updated: 11, discount_window_boundary: 2, price_changed_at_checkout: 1 },
    unexplained_unresolved: 3,
    last_unexplained_at: '2026-10-04T12:30:11.512345+00:00',
  };
}
