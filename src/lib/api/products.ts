import { get, post, patch, del } from './client';
import { DEFAULT_UNIT_LABEL } from '@/lib/utils/unitLabel';
import type { Product, ProductPricingTier, ProductDiscountSummary, ProductSummary, ProductsListResponse, ProductFilters, ProductSideOption, CustomizationMode } from '@/types';

// ── Normalizer ────────────────────────────────────────────────────────────────
type RawTier = Omit<ProductPricingTier, 'mrp_per_unit'> & { mrp_per_unit?: number | null };

type RawProduct = Omit<Product, 'id' | 'category_id' | 'sides_options' | 'pricing_tiers' | 'discount' | 'discount_starts_at' | 'discount_ends_at' | 'unit_label' | 'listing_quantity' | 'min_order_quantity' | 'max_order_quantity'> & {
  unit_label?: string;
  listing_quantity?: number | null;
  min_order_quantity?: number | null;
  max_order_quantity?: number | null;
  id: number | string;
  pricing_tiers: RawTier[];
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  discount?: ProductDiscountSummary;
  category_id: number | string | null;
  // Backend may return old string[] format during migration — normalise to object[]
  sides_options: Array<string | (Omit<ProductSideOption, 'is_active'> & { is_active?: boolean })>;
};

function normalizeSide(s: RawProduct['sides_options'][number]): ProductSideOption {
  return typeof s === 'string'
    ? { label: s, is_active: true, is_default: false, price_multiplier: 1.0 }
    : { ...s, is_active: s.is_active ?? true };
}

function normalize(raw: RawProduct): ProductSummary {
  const product: Product = {
    ...raw,
    id: String(raw.id),
    unit_label: raw.unit_label || DEFAULT_UNIT_LABEL,
    listing_quantity: raw.listing_quantity ?? null,
    min_order_quantity: raw.min_order_quantity ?? null,
    max_order_quantity: raw.max_order_quantity ?? null,
    category_id: raw.category_id != null ? String(raw.category_id) : null,
    sides_options: (raw.sides_options ?? []).map(normalizeSide),
    pricing_tiers: raw.pricing_tiers.map((t) => ({ ...t, mrp_per_unit: t.mrp_per_unit ?? null })),
    discount_starts_at: raw.discount_starts_at ?? null,
    discount_ends_at: raw.discount_ends_at ?? null,
    discount: raw.discount ?? { status: 'none', max_percent: null },
  };
  return {
    ...product,
    // Use thumb variant (300px) for table cells — not full-resolution
    primary_image_url: product.images[0]?.thumb ?? null,
    min_price: product.pricing_tiers.length
      ? Math.min(...product.pricing_tiers.map((t) => t.price_per_unit))
      : 0,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
interface RawListResponse {
  items: RawProduct[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsListResponse> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    page_size: filters.page_size ?? 20,
  };
  if (filters.category_id) params.category_id = Number(filters.category_id);
  if (filters.status) params.status = filters.status;
  if (filters.q) params.q = filters.q;
  if (filters.sort) params.sort = filters.sort;

  const res = await get<RawListResponse>('/admin/products', params);
  return { ...res, items: res.items.map(normalize) };
}

// ── Single ────────────────────────────────────────────────────────────────────
export async function getProduct(id: string): Promise<ProductSummary> {
  const raw = await get<RawProduct>(`/admin/products/${id}`);
  return normalize(raw);
}

// ── Create / Update ───────────────────────────────────────────────────────────
export interface ProductPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  short_description?: string | null;
  category_id?: number | null;
  status?: string;
  badge?: string;
  is_featured?: boolean;
  tags?: string[];
  sizes?: object[];
  paper_types?: object[];
  finishes?: object[];
  sides_options?: object[];
  quantity_steps?: number[];
  unit_label?: string;
  listing_quantity?: number | null;
  min_order_quantity?: number | null;
  max_order_quantity?: number | null;
  pricing_tiers?: object[];
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  turnaround_options?: object[];
  seo?: object;
  image_keys?: string[];
  video_key?: string | null;
  track_inventory?: boolean;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
  customization_mode?: CustomizationMode;
  template_fields?: object[];
}

export async function createProduct(data: ProductPayload): Promise<ProductSummary> {
  const raw = await post<RawProduct>('/admin/products', data);
  return normalize(raw);
}

export async function updateProduct(id: string, data: ProductPayload): Promise<ProductSummary> {
  const raw = await patch<RawProduct>(`/admin/products/${id}`, data);
  return normalize(raw);
}

// DELETE returns 204 No Content — no body to unwrap
export async function deleteProduct(id: string): Promise<void> {
  await del<void>(`/admin/products/${id}`);
}
