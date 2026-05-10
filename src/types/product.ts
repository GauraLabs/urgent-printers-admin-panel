export type ProductStatus = 'draft' | 'active' | 'archived';
// Backend enum: 'none' is the "no badge" value, not null
export type ProductBadge = 'none' | 'bestseller' | 'new' | 'sale' | 'popular';
export type SizeUnit = 'mm' | 'cm' | 'in' | 'ft';
export type CustomizationMode = 'artwork' | 'template' | 'both' | 'none';

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'url';
  placeholder?: string;
  required: boolean;
  max_length?: number;
}

// ── Print spec sub-types (no id — backend stores these in JSONB) ───────────────
export interface ProductSize {
  label: string;
  width: number;
  height: number;
  unit: SizeUnit;
  is_active: boolean;
  is_default: boolean;
  price_multiplier: number;
}

export interface ProductPaperType {
  label: string;
  gsm: number | null;
  is_active: boolean;
  is_default: boolean;
  price_multiplier: number;
}

export interface ProductFinish {
  label: string;
  is_active: boolean;
  is_default: boolean;
  price_multiplier: number;
}

export interface ProductSideOption {
  label: string;
  is_default: boolean;
  price_multiplier: number;
}

export interface ProductPricingTier {
  quantity: number;
  price_per_unit: number;
  is_best_value: boolean;
}

export interface ProductTurnaroundOption {
  type: 'standard' | 'express' | 'rush';
  days: number;
  extra_cost: number;
  is_active: boolean;
}

export interface ProductSeoMeta {
  title: string | null;
  description: string | null;
  canonical_url: string | null;
}

// ── Media upload API response types ───────────────────────────────────────────
export interface MediaVariant {
  url: string;
  width: number;
  height: number;
}

export interface MediaUploadImageResult {
  type: 'image';
  key: string;
  original: MediaVariant & { size_bytes: number };
  variants: {
    thumb: MediaVariant;
    md: MediaVariant;
    lg: MediaVariant;
  };
}

export interface MediaUploadVideoResult {
  type: 'video';
  key: string;
  video: { url: string; size_bytes: number; duration_seconds: number };
  thumbnail: MediaVariant;
}

export type MediaUploadResult = MediaUploadImageResult | MediaUploadVideoResult;

// ── Image variant URLs (from AdminProductResponse.images[]) ───────────────────
export interface ProductImageURLSet {
  key: string;
  thumb: string;     // 300×300 — tables, small grids
  md: string;        // 800px wide — product cards, storefront listing
  lg: string;        // 1600px wide — product detail hero
  original: string;  // full resolution — lightbox / download
}

// ── Product — matches AdminProductResponse exactly ────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  status: ProductStatus;
  badge: ProductBadge;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  sizes: ProductSize[];
  paper_types: ProductPaperType[];
  finishes: ProductFinish[];
  sides_options: ProductSideOption[];
  quantity_steps: number[];
  pricing_tiers: ProductPricingTier[];
  turnaround_options: ProductTurnaroundOption[];
  seo: ProductSeoMeta;
  // media
  image_keys: string[];              // sent on save; source of truth for ordering
  images: ProductImageURLSet[];      // resolved variant URLs per image
  video_key: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  // customization
  customization_mode: CustomizationMode;
  template_fields: TemplateField[];
  // inventory
  track_inventory: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  // stats
  rating: number;
  review_count: number;
  created_at: string;
}

// ── ProductSummary — normalizer computes primary_image_url and min_price ───────
export interface ProductSummary extends Product {
  primary_image_url: string | null;
  min_price: number;
}

export interface ProductsListResponse {
  items: ProductSummary[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Backend list accepts is_active (bool) not status.
// status='active' → is_active=true, else is_active=false.
// status filter is limited until backend adds a status query param.
export interface ProductFilters {
  status?: ProductStatus;
  category_id?: string;
  page?: number;
  page_size?: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  orders_count: number;
  revenue: number;
  avg_order_value: number;
  top_size: string | null;
  top_turnaround: string | null;
}
