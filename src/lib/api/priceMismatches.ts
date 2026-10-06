import { get, patch } from './client';
import { istLocalToUtcIso } from '@/lib/utils/istDate';
import { FIXTURE_ITEMS, fixtureSummary } from './fixtures/priceMismatches';

// Contract fixtures are used only when NEXT_PUBLIC_PRICE_MISMATCH_FIXTURES=true;
// otherwise this talks to the real /admin/price-mismatches endpoints.
const USE_FIXTURES = process.env.NEXT_PUBLIC_PRICE_MISMATCH_FIXTURES === 'true';

export const MISMATCH_CAUSES = [
  'product_updated',
  'discount_window_boundary',
  'price_changed_at_checkout',
  'unexplained',
] as const;
export type MismatchCause = (typeof MISMATCH_CAUSES)[number];
export type MismatchStage = 'preview' | 'order_create';

export interface MismatchContext {
  user_agent?: string;
  request_id?: string;
  added_at?: string;
  added_at_source: AddedAtSource;
}

export type AddedAtSource = 'client' | 'server_cart' | null;

export interface PriceMismatch {
  id: string;
  created_at: string;
  stage: MismatchStage;
  user_id: string | null;
  product_id: string | null;
  product_slug: string | null;
  quantity: number | null;
  options: Record<string, unknown>;
  client_unit: number | null;
  server_unit: number | null;
  client_mrp: number | null;
  server_mrp: number | null;
  client_total: number | null;
  server_total: number | null;
  diff_total: number | null;
  likely_cause: MismatchCause;
  context: MismatchContext;
  resolved_at: string | null;
  resolved_by: { id: string; name: string } | null;
  note: string | null;
}

export interface PriceMismatchPage {
  items: PriceMismatch[];
  total: number;
  offset: number;
  limit: number;
}

export interface PriceMismatchSummary {
  by_cause: Record<MismatchCause, number>;
  unexplained_unresolved: number;
  last_unexplained_at: string | null;
}

type Idish = number | string | null | undefined;
type Numish = number | string | null | undefined;

type RawContext = Omit<MismatchContext, 'added_at_source'> & { added_at_source?: string | null };

export interface RawPriceMismatch {
  id: Idish;
  created_at: string;
  stage: MismatchStage;
  user_id?: Idish;
  product_id?: Idish;
  product_slug?: string | null;
  quantity?: Numish;
  options?: Record<string, unknown> | null;
  client_unit?: Numish;
  server_unit?: Numish;
  client_mrp?: Numish;
  server_mrp?: Numish;
  client_total?: Numish;
  server_total?: Numish;
  diff_total?: Numish;
  likely_cause: string;
  context?: RawContext | null;
  resolved_at?: string | null;
  resolved_by?: { id: Idish; name: string } | null;
  note?: string | null;
}

export interface RawPriceMismatchPage {
  items: RawPriceMismatch[];
  total: number;
  offset: number;
  limit: number;
}

export interface RawPriceMismatchSummary {
  by_cause?: Partial<Record<string, number>> | null;
  unexplained_unresolved?: number | null;
  last_unexplained_at?: string | null;
}

export function toNum(v: Numish): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toId(v: Idish): string | null {
  return v == null ? null : String(v);
}

function toContext(raw: RawContext | null | undefined): MismatchContext {
  const src = raw?.added_at_source;
  return { ...raw, added_at_source: src === 'client' || src === 'server_cart' ? src : null };
}

function toCause(v: string): MismatchCause {
  return (MISMATCH_CAUSES as readonly string[]).includes(v) ? (v as MismatchCause) : 'unexplained';
}

export function normalisePriceMismatch(raw: RawPriceMismatch): PriceMismatch {
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    stage: raw.stage,
    user_id: toId(raw.user_id),
    product_id: toId(raw.product_id),
    product_slug: raw.product_slug ?? null,
    quantity: toNum(raw.quantity),
    options: raw.options ?? {},
    client_unit: toNum(raw.client_unit),
    server_unit: toNum(raw.server_unit),
    client_mrp: toNum(raw.client_mrp),
    server_mrp: toNum(raw.server_mrp),
    client_total: toNum(raw.client_total),
    server_total: toNum(raw.server_total),
    diff_total: toNum(raw.diff_total),
    likely_cause: toCause(raw.likely_cause),
    context: toContext(raw.context),
    resolved_at: raw.resolved_at ?? null,
    resolved_by: raw.resolved_by ? { id: String(raw.resolved_by.id), name: raw.resolved_by.name } : null,
    note: raw.note ?? null,
  };
}

export function normalisePriceMismatchPage(raw: RawPriceMismatchPage): PriceMismatchPage {
  return {
    items: (raw.items ?? []).map(normalisePriceMismatch),
    total: raw.total ?? 0,
    offset: raw.offset ?? 0,
    limit: raw.limit ?? 0,
  };
}

export function normalisePriceMismatchSummary(raw: RawPriceMismatchSummary): PriceMismatchSummary {
  const by_cause = { product_updated: 0, discount_window_boundary: 0, price_changed_at_checkout: 0, unexplained: 0 };
  for (const cause of MISMATCH_CAUSES) by_cause[cause] = raw.by_cause?.[cause] ?? 0;
  return {
    by_cause,
    unexplained_unresolved: raw.unexplained_unresolved ?? 0,
    last_unexplained_at: raw.last_unexplained_at ?? null,
  };
}

export const PRICE_MISMATCH_PAGE_SIZE = 25;

export interface PriceMismatchFilters {
  cause: MismatchCause | 'all';
  stage: MismatchStage | 'all';
  resolved: 'unresolved' | 'resolved' | 'all';
  /** IST calendar dates, YYYY-MM-DD, inclusive; '' = open-ended. */
  fromDate: string;
  toDate: string;
  offset: number;
}

export const DEFAULT_PRICE_MISMATCH_FILTERS: PriceMismatchFilters = {
  cause: 'unexplained',
  stage: 'all',
  resolved: 'unresolved',
  fromDate: '',
  toDate: '',
  offset: 0,
};

export function buildPriceMismatchParams(f: PriceMismatchFilters): Record<string, unknown> {
  const params: Record<string, unknown> = { offset: f.offset, limit: PRICE_MISMATCH_PAGE_SIZE };
  if (f.cause !== 'all') params.cause = f.cause;
  if (f.stage !== 'all') params.stage = f.stage;
  if (f.resolved !== 'all') params.resolved = f.resolved === 'resolved';
  const from = f.fromDate ? istLocalToUtcIso(`${f.fromDate}T00:00`) : null;
  const to = f.toDate ? istLocalToUtcIso(`${f.toDate}T23:59`) : null;
  if (from) params.from = from;
  if (to) params.to = to;
  return params;
}

export async function getPriceMismatches(filters: PriceMismatchFilters): Promise<PriceMismatchPage> {
  const params = buildPriceMismatchParams(filters);
  if (USE_FIXTURES) {
    const rows = FIXTURE_ITEMS.filter((i) =>
      (params.cause === undefined || i.likely_cause === params.cause) &&
      (params.stage === undefined || i.stage === params.stage) &&
      (params.resolved === undefined || (i.resolved_at !== null) === params.resolved),
    );
    const offset = filters.offset;
    return normalisePriceMismatchPage({
      items: rows.slice(offset, offset + PRICE_MISMATCH_PAGE_SIZE),
      total: rows.length,
      offset,
      limit: PRICE_MISMATCH_PAGE_SIZE,
    });
  }
  const raw = await get<RawPriceMismatchPage>('/admin/price-mismatches', params);
  return normalisePriceMismatchPage(raw);
}

export async function getPriceMismatchSummary(days = 7): Promise<PriceMismatchSummary> {
  if (USE_FIXTURES) return normalisePriceMismatchSummary(fixtureSummary());
  const raw = await get<RawPriceMismatchSummary>('/admin/price-mismatches/summary', { days });
  return normalisePriceMismatchSummary(raw);
}

export async function resolvePriceMismatch(
  id: string,
  body: { resolved: boolean; note?: string },
): Promise<PriceMismatch> {
  if (USE_FIXTURES) {
    const item = FIXTURE_ITEMS.find((i) => String(i.id) === id);
    if (!item) throw new Error('Not found');
    item.resolved_at = body.resolved ? new Date().toISOString() : null;
    item.resolved_by = body.resolved ? { id: 1, name: 'You' } : null;
    if (body.note !== undefined) item.note = body.note || null;
    return normalisePriceMismatch(item);
  }
  const raw = await patch<RawPriceMismatch>(`/admin/price-mismatches/${id}`, body);
  return normalisePriceMismatch(raw);
}
