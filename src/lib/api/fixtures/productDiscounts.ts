// Contract fixtures for the bulk-discount endpoints (spec section 2.7), used
// while the backend is not yet on a reachable environment. Enabled only when
// NEXT_PUBLIC_DISCOUNT_FIXTURES=true; otherwise src/lib/api/productDiscounts.ts
// talks to the real API and none of this file is reached.
//
// To swap for the real API: unset the env flag. No call sites change.

import type {
  BulkDiscountRequest,
  BulkProductChange,
  BulkDiscountSummary,
  BulkDiscountPreview,
  BulkDiscountCommitResult,
  BulkDiscountBatch,
  BulkDiscountUndoResult,
} from '@/types';
import { priceForPercentOff } from '@/lib/utils/discount';

export const FIXTURE_PRODUCT_CHANGES: BulkProductChange[] = [
  {
    id: '11', name: 'Premium Business Cards', slug: 'premium-business-cards', status: 'active',
    skipped_reason: null, had_existing_discount: false,
    tiers: [
      { quantity: 100, before: { mrp_per_unit: null, price_per_unit: 12 }, after: { mrp_per_unit: 12, price_per_unit: 9 }, discount_percent: 25, skipped_reason: null },
      { quantity: 500, before: { mrp_per_unit: null, price_per_unit: 7 }, after: { mrp_per_unit: 7, price_per_unit: 5.25 }, discount_percent: 25, skipped_reason: null },
    ],
  },
  {
    id: '12', name: 'A5 Flyers', slug: 'a5-flyers', status: 'active',
    skipped_reason: 'already_discounted', had_existing_discount: true,
    tiers: [
      { quantity: 250, before: { mrp_per_unit: 4, price_per_unit: 3 }, after: { mrp_per_unit: 4, price_per_unit: 3 }, discount_percent: 25, skipped_reason: null },
    ],
  },
  {
    id: '13', name: 'Old Poster', slug: 'old-poster', status: 'archived',
    skipped_reason: 'archived', had_existing_discount: false, tiers: [],
  },
];

function summarise(products: BulkProductChange[]): BulkDiscountSummary {
  const skipped = products.filter((p) => p.skipped_reason).length;
  return { matched: products.length, changed: products.length - skipped, skipped };
}

export function fixturePreview(req: BulkDiscountRequest): BulkDiscountPreview {
  const products = FIXTURE_PRODUCT_CHANGES.map((p) => {
    if (req.action === 'apply' && req.percent != null && !p.skipped_reason) {
      return {
        ...p,
        tiers: p.tiers.map((t) => {
          const price = priceForPercentOff(t.before.price_per_unit, req.percent as number);
          return { ...t, after: { mrp_per_unit: t.before.price_per_unit, price_per_unit: price } };
        }),
      };
    }
    return p;
  });
  return { dry_run: true, preview_token: 'fixture-token', expires_in: 600, summary: summarise(products), products };
}

export function fixtureCommit(req: BulkDiscountRequest): BulkDiscountCommitResult {
  const preview = fixturePreview(req);
  return { dry_run: false, batch_id: '501', summary: preview.summary, products: preview.products };
}

export const FIXTURE_BATCHES: BulkDiscountBatch[] = [
  { id: '501', action: 'apply', percent: 25, scope_summary: '2 selected products', created_by: 'Priya Nair', created_at: '2026-10-02T09:30:00Z', undone_at: null },
  { id: '498', action: 'clear', percent: null, scope_summary: 'Category: Business Cards', created_by: 'Priya Nair', created_at: '2026-09-28T11:00:00Z', undone_at: '2026-09-28T11:05:00Z' },
];

export function fixtureUndo(batchId: string): BulkDiscountUndoResult {
  return {
    batch_id: batchId,
    summary: { matched: 2, changed: 1, skipped: 1 },
    products: [
      { id: '11', name: 'Premium Business Cards', skipped_reason: null },
      { id: '12', name: 'A5 Flyers', skipped_reason: 'modified_since' },
    ],
  };
}
