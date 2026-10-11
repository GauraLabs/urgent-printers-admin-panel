import { get, post, patch, del } from './client';
import type { ProductImageURLSet } from '@/types/product';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  meta_title: string | null;
  meta_description: string | null;
  // media
  image_keys: string[];
  images: ProductImageURLSet[];
  video_key: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  created_at: string;
  seo_intro: string | null;
  seo_body: string | null;
  faqs: CategoryFaq[];
  google_product_category: string | null;
  noindex: boolean;
  ancestors: CategoryRef[];
  path: string;
  /** Rolled up across all descendants; `product_count` stays direct-only. */
  total_product_count: number;
  children_count: number;
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

interface RawCategoryRef { id: number | string; name: string; slug: string }

type RawCategory = Omit<
  Category,
  'id' | 'parent_id' | 'image_keys' | 'images' | 'ancestors' | 'path' | 'total_product_count'
  | 'children_count' | 'faqs' | 'seo_intro' | 'seo_body' | 'google_product_category' | 'noindex'
> & {
  id: number | string;
  parent_id: number | string | null;
  image_keys: string[];
  images: ProductImageURLSet[];
  ancestors?: RawCategoryRef[] | null;
  path?: string | null;
  total_product_count?: number | null;
  children_count?: number | null;
  faqs?: CategoryFaq[] | null;
  seo_intro?: string | null;
  seo_body?: string | null;
  google_product_category?: string | null;
  noindex?: boolean | null;
};

function normalize(raw: RawCategory): Category {
  return {
    ...raw,
    id: String(raw.id),
    parent_id: raw.parent_id != null ? String(raw.parent_id) : null,
    ancestors: (raw.ancestors ?? []).map((a) => ({ id: String(a.id), name: a.name, slug: a.slug })),
    path: raw.path ?? raw.name,
    total_product_count: raw.total_product_count ?? raw.product_count,
    children_count: raw.children_count ?? 0,
    faqs: raw.faqs ?? [],
    seo_intro: raw.seo_intro ?? null,
    seo_body: raw.seo_body ?? null,
    google_product_category: raw.google_product_category ?? null,
    noindex: raw.noindex ?? false,
  };
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  image_keys?: string[];
  video_key?: string | null;
  parent_id?: number | null;
  seo_intro?: string | null;
  seo_body?: string | null;
  faqs?: CategoryFaq[];
  google_product_category?: string | null;
  noindex?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  image_keys?: string[];
  video_key?: string | null;
  /** Send explicit `null` to make the category top-level; omit to leave untouched. */
  parent_id?: number | null;
  seo_intro?: string | null;
  seo_body?: string | null;
  /** `[]` clears all FAQs; omit to leave untouched. */
  faqs?: CategoryFaq[];
  google_product_category?: string | null;
  noindex?: boolean;
}

export async function getCategories(): Promise<Category[]> {
  const items = await get<RawCategory[]>('/admin/categories');
  return items.map(normalize);
}

export async function getCategory(id: string): Promise<Category> {
  const raw = await get<RawCategory>(`/admin/categories/${id}`);
  return normalize(raw);
}

export async function createCategory(data: CategoryCreateRequest): Promise<Category> {
  const raw = await post<RawCategory>('/admin/categories', data);
  return normalize(raw);
}

export async function updateCategory(id: string, data: CategoryUpdateRequest): Promise<Category> {
  const raw = await patch<RawCategory>(`/admin/categories/${id}`, data);
  return normalize(raw);
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(`/admin/categories/${id}`);
}

export async function reorderCategories(ids: string[]): Promise<{ success: boolean }> {
  return patch<{ success: boolean }>('/admin/categories/reorder', { ids: ids.map(Number) });
}

export interface BulkCategoryMoveResult {
  category_id: string;
  moved: number;
  unchanged: number;
  moved_product_ids: string[];
}

export async function bulkMoveProductsToCategory(
  productIds: string[],
  categoryId: string,
): Promise<BulkCategoryMoveResult> {
  const raw = await patch<{
    category_id: number | string;
    moved: number;
    unchanged: number;
    moved_product_ids: Array<number | string>;
  }>('/admin/products/bulk-category', {
    product_ids: productIds.map(Number),
    category_id: Number(categoryId),
  });
  return {
    category_id: String(raw.category_id),
    moved: raw.moved,
    unchanged: raw.unchanged,
    moved_product_ids: raw.moved_product_ids.map(String),
  };
}
