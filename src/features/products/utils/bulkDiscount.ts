import { hasAtMostTwoDecimals } from '@/lib/utils/discount';
import { istLocalToUtcIso } from '@/lib/utils/istDate';
import type { BulkDiscountAction, BulkDiscountRequest } from '@/types';

export const MAX_BULK_PRODUCTS = 500;

export type BulkScopeMode = 'selected' | 'category';

export interface BulkInput {
  action: BulkDiscountAction;
  scopeMode: BulkScopeMode;
  selectedIds: string[];
  categoryId: string;
  percent: string;
  startsAtLocal: string;
  endsAtLocal: string;
  overwriteExisting: boolean;
}

export type BulkParams = Pick<BulkDiscountRequest, 'action' | 'scope' | 'percent' | 'starts_at' | 'ends_at' | 'overwrite_existing'>;

export function validateBulkInput(input: BulkInput, now: Date = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.scopeMode === 'selected') {
    if (input.selectedIds.length === 0) errors.scope = 'Select at least one product';
    else if (input.selectedIds.length > MAX_BULK_PRODUCTS) errors.scope = `At most ${MAX_BULK_PRODUCTS} products per batch`;
  } else if (!input.categoryId) {
    errors.scope = 'Choose a category';
  }

  if (input.action === 'apply') {
    const pct = input.percent.trim() === '' ? NaN : Number(input.percent);
    if (Number.isNaN(pct)) errors.percent = 'Enter a percentage';
    else if (!(pct > 0 && pct < 100)) errors.percent = 'Percent must be above 0 and below 100';
    else if (!hasAtMostTwoDecimals(pct)) errors.percent = 'At most 2 decimal places';

    const start = istLocalToUtcIso(input.startsAtLocal);
    const end = istLocalToUtcIso(input.endsAtLocal);
    if (input.startsAtLocal && !start) errors.starts_at = 'Enter a valid start';
    if (input.endsAtLocal && !end) errors.ends_at = 'Enter a valid end';
    if (start && end && new Date(end) <= new Date(start)) errors.ends_at = 'Sale end must be after sale start';
    else if (end && new Date(end) <= now) errors.ends_at = 'Sale end must be in the future';
  }

  return errors;
}

export function buildBulkParams(input: BulkInput): BulkParams {
  const scope = input.scopeMode === 'selected'
    ? { product_ids: input.selectedIds.map(Number), category_id: null }
    : { product_ids: null, category_id: Number(input.categoryId) };

  if (input.action === 'clear') {
    return { action: 'clear', scope, percent: null, starts_at: null, ends_at: null, overwrite_existing: false };
  }
  return {
    action: 'apply',
    scope,
    percent: Number(input.percent),
    starts_at: istLocalToUtcIso(input.startsAtLocal),
    ends_at: istLocalToUtcIso(input.endsAtLocal),
    overwrite_existing: input.overwriteExisting,
  };
}

const SKIP_LABELS: Record<string, string> = {
  archived: 'Archived product',
  already_discounted: 'Already has a discount (enable overwrite)',
  existing_discount: 'Already has a discount (enable overwrite)',
  no_effective_change: 'No change',
  modified_since: 'Edited since the batch was applied',
  no_change: 'No change (already at this price)',
  no_eligible_tiers: 'No pricing tiers can take this discount',
  no_discount: 'No discount to clear',
  price_out_of_range: 'Resulting price is out of range',
  invalid_price: 'Invalid price on a tier',
  product_missing: 'Product no longer exists',
};

export function describeSkipReason(reason: string): string {
  return SKIP_LABELS[reason] ?? reason.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
