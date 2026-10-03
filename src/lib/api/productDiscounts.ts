import { get, post } from './client';
import {
  fixtureCommit, fixturePreview, fixtureUndo, FIXTURE_BATCHES,
} from './fixtures/productDiscounts';
import type {
  BulkDiscountAction,
  BulkDiscountBatch,
  BulkDiscountCommitResult,
  BulkDiscountPreview,
  BulkDiscountRequest,
  BulkDiscountSummary,
  BulkDiscountUndoResult,
  BulkProductChange,
  BulkTierChange,
} from '@/types';

const USE_FIXTURES = process.env.NEXT_PUBLIC_DISCOUNT_FIXTURES === 'true';

type RawTierChange = Omit<BulkTierChange, 'before' | 'after'> & {
  before: { mrp_per_unit: number | string | null; price_per_unit: number | string };
  after: { mrp_per_unit: number | string | null; price_per_unit: number | string };
};
type RawProductChange = Omit<BulkProductChange, 'id' | 'tiers'> & { id: number | string; tiers: RawTierChange[] };

const num = (v: number | string): number => Number(v);
const numOrNull = (v: number | string | null | undefined): number | null => (v == null ? null : Number(v));

function normaliseProduct(raw: RawProductChange): BulkProductChange {
  return {
    ...raw,
    id: String(raw.id),
    tiers: (raw.tiers ?? []).map((t) => ({
      ...t,
      before: { mrp_per_unit: numOrNull(t.before.mrp_per_unit), price_per_unit: num(t.before.price_per_unit) },
      after: { mrp_per_unit: numOrNull(t.after.mrp_per_unit), price_per_unit: num(t.after.price_per_unit) },
    })),
  };
}

interface RawPreview {
  dry_run: true;
  preview_token: string;
  expires_in: number;
  summary: BulkDiscountSummary;
  products: RawProductChange[];
}

interface RawCommit {
  dry_run: false;
  batch_id: number | string;
  summary: BulkDiscountSummary;
  products: RawProductChange[];
}

type BulkParams = Pick<BulkDiscountRequest, 'action' | 'scope' | 'percent' | 'starts_at' | 'ends_at' | 'overwrite_existing'>;

export async function previewBulkDiscount(params: BulkParams): Promise<BulkDiscountPreview> {
  const body: BulkDiscountRequest = { ...params, dry_run: true, preview_token: null };
  if (USE_FIXTURES) return fixturePreview(body);
  const raw = await post<RawPreview>('/admin/products/discounts/bulk', body);
  return { ...raw, products: raw.products.map(normaliseProduct) };
}

export async function commitBulkDiscount(params: BulkParams, previewToken: string): Promise<BulkDiscountCommitResult> {
  const body: BulkDiscountRequest = { ...params, dry_run: false, preview_token: previewToken };
  if (USE_FIXTURES) return fixtureCommit(body);
  const raw = await post<RawCommit>('/admin/products/discounts/bulk', body);
  return { ...raw, batch_id: String(raw.batch_id), products: raw.products.map(normaliseProduct) };
}

export async function undoBulkDiscount(batchId: string): Promise<BulkDiscountUndoResult> {
  if (USE_FIXTURES) return fixtureUndo(batchId);
  const raw = await post<{
    batch_id: number | string;
    summary: BulkDiscountSummary;
    products?: Array<{ id: number | string; name: string; skipped_reason: string | null }>;
  }>(`/admin/products/discounts/batches/${batchId}/undo`);
  return {
    batch_id: String(raw.batch_id),
    summary: raw.summary,
    products: (raw.products ?? []).map((p) => ({ ...p, id: String(p.id) })),
  };
}

interface RawBatch {
  id: number | string;
  action: BulkDiscountAction;
  percent: number | string | null;
  scope_summary?: string;
  scope?: { product_ids?: Array<number | string> | null; category_id?: number | string | null };
  created_by?: string | { name?: string | null } | null;
  created_by_name?: string | null;
  created_at: string;
  undone_at: string | null;
}

function scopeSummary(raw: RawBatch): string {
  if (raw.scope_summary) return raw.scope_summary;
  if (raw.scope?.category_id != null) return `Category #${raw.scope.category_id}`;
  const n = raw.scope?.product_ids?.length;
  return n != null ? `${n} selected product${n === 1 ? '' : 's'}` : '—';
}

function normaliseBatch(raw: RawBatch): BulkDiscountBatch {
  const createdBy = typeof raw.created_by === 'object' && raw.created_by !== null
    ? raw.created_by.name ?? null
    : raw.created_by ?? raw.created_by_name ?? null;
  return {
    id: String(raw.id),
    action: raw.action,
    percent: numOrNull(raw.percent),
    scope_summary: scopeSummary(raw),
    created_by: createdBy,
    created_at: raw.created_at,
    undone_at: raw.undone_at ?? null,
  };
}

export async function getBulkDiscountBatches(limit = 20): Promise<BulkDiscountBatch[]> {
  if (USE_FIXTURES) return FIXTURE_BATCHES;
  const raw = await get<RawBatch[] | { items: RawBatch[] }>('/admin/products/discounts/batches', { limit });
  const items = Array.isArray(raw) ? raw : raw.items;
  return items.map(normaliseBatch);
}
