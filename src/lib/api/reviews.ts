import { get, patch } from './client';
import type { Review, PaginatedResponse } from '@/types';

interface RawReview {
  id: number | string;
  product_id: number | string;
  product_name: string;
  user_id: number | string;
  customer_name: string;
  order_id: number | string;
  order_number: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: unknown[] | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  status: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
}

function normaliseReview(raw: RawReview): Review {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    customer_name: raw.customer_name,
    product_id: String(raw.product_id),
    product_name: raw.product_name,
    order_id: String(raw.order_id),
    order_number: raw.order_number,
    rating: raw.rating,
    title: raw.title,
    body: raw.body,
    images: (raw.images ?? []).map((v) => String(v)),
    is_verified_purchase: raw.is_verified_purchase,
    helpful_count: raw.helpful_count,
    status: raw.status as Review['status'],
    admin_reply: raw.admin_reply,
    admin_reply_at: raw.admin_reply_at,
    created_at: raw.created_at,
  };
}

export async function getReviews(filters: {
  status?: string;
  product_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<PaginatedResponse<Review>> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page,
    page_size: filters.page_size,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.product_id ? { product_id: filters.product_id } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  const raw = await get<{
    items: RawReview[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('/admin/reviews', params);

  return {
    items: raw.items.map(normaliseReview),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
  };
}

export async function updateReviewStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<{ id: string; status: string }> {
  const data = await patch<{ id: number | string; status: string }>(`/admin/reviews/${id}/status`, { status });
  return { id: String(data.id), status: data.status };
}

export async function replyToReview(
  id: string,
  reply: string
): Promise<{ id: string; admin_reply: string | null; admin_reply_at: string | null }> {
  const data = await patch<{ id: number | string; admin_reply: string | null; admin_reply_at: string | null }>(
    `/admin/reviews/${id}/reply`,
    { admin_reply: reply }
  );
  return { id: String(data.id), admin_reply: data.admin_reply, admin_reply_at: data.admin_reply_at };
}
