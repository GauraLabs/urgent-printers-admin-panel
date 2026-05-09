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
}

type RawCategory = Omit<Category, 'id' | 'parent_id' | 'image_keys' | 'images'> & {
  id: number | string;
  parent_id: number | string | null;
  image_keys: string[];
  images: ProductImageURLSet[];
};

function normalize(raw: RawCategory): Category {
  return {
    ...raw,
    id: String(raw.id),
    parent_id: raw.parent_id != null ? String(raw.parent_id) : null,
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
