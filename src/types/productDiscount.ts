export type BulkDiscountAction = 'apply' | 'clear';

export interface BulkDiscountScope {
  product_ids: number[] | null;
  category_id: number | null;
}

export interface BulkDiscountRequest {
  action: BulkDiscountAction;
  scope: BulkDiscountScope;
  percent: number | null;
  starts_at: string | null;
  ends_at: string | null;
  overwrite_existing: boolean;
  dry_run: boolean;
  preview_token: string | null;
}

export interface BulkTierState {
  mrp_per_unit: number | null;
  price_per_unit: number;
}

export interface BulkTierChange {
  quantity: number;
  before: BulkTierState;
  after: BulkTierState;
  discount_percent: number | null;
  skipped_reason: string | null;
}

export interface BulkProductChange {
  id: string;
  name: string;
  slug: string;
  status: string;
  skipped_reason: string | null;
  had_existing_discount: boolean;
  tiers: BulkTierChange[];
}

export interface BulkDiscountSummary {
  matched: number;
  changed: number;
  skipped: number;
}

export interface BulkDiscountPreview {
  dry_run: true;
  preview_token: string;
  expires_in: number;
  summary: BulkDiscountSummary;
  products: BulkProductChange[];
}

export interface BulkDiscountCommitResult {
  dry_run: false;
  batch_id: string;
  summary: BulkDiscountSummary;
  products: BulkProductChange[];
}

export interface BulkDiscountBatch {
  id: string;
  action: BulkDiscountAction;
  percent: number | null;
  scope_summary: string;
  created_by: string | null;
  created_at: string;
  undone_at: string | null;
}

export interface BulkDiscountUndoResult {
  batch_id: string;
  summary: BulkDiscountSummary;
  products: Array<{ id: string; name: string; skipped_reason: string | null }>;
}

export const BULK_DISCOUNT_ERROR = {
  PREVIEW_STALE: 'preview_stale',
  ALREADY_UNDONE: 'already_undone',
  WINDOW_IN_PAST: 'discount_window_in_past',
  WINDOW_REQUIRES_MRP: 'discount_window_requires_mrp',
  SCOPE_TOO_LARGE: 'scope_too_large',
  PRODUCTS_NOT_FOUND: 'products_not_found',
  INVALID_MRP: 'invalid_mrp',
} as const;
