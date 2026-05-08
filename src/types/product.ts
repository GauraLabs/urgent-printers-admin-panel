export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductBadge = 'bestseller' | 'new' | 'sale' | 'popular' | null;

export interface ProductSize {
  id: string;
  label: string;
  width_mm: number;
  height_mm: number;
  is_active: boolean;
}

export interface ProductPaperType {
  id: string;
  label: string;
  gsm: number | null;
  is_active: boolean;
}

export interface ProductFinish {
  id: string;
  label: string;
  is_active: boolean;
}

export interface ProductPricingTier {
  id: string;
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

// ── Stored media on a product ──────────────────────────────────────────────────
export interface ProductImage {
  id: string;
  key: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  original_url: string;
  thumb_url: string;
  md_url: string;
  lg_url: string;
}

export interface ProductVideo {
  key: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
}

export interface ProductSeoMeta {
  title: string | null;
  description: string | null;
  canonical_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  category_name: string;
  status: ProductStatus;
  badge: ProductBadge;
  is_featured: boolean;
  tags: string[];
  images: ProductImage[];
  video: ProductVideo | null;
  sizes: ProductSize[];
  paper_types: ProductPaperType[];
  finishes: ProductFinish[];
  sides_options: string[];
  quantity_steps: number[];
  pricing_tiers: ProductPricingTier[];
  turnaround_options: ProductTurnaroundOption[];
  seo: ProductSeoMeta;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  status: ProductStatus;
  badge: ProductBadge;
  is_featured: boolean;
  primary_image_url: string | null;
  min_price: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
}

export interface ProductsListResponse {
  items: ProductSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFilters {
  status?: ProductStatus;
  category_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
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
