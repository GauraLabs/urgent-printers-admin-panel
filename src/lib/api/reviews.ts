import type { Review, PaginatedResponse } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getReviews(filters: { status?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Review>> {
  await delay();
  const items: Review[] = Array.from({ length: 15 }, (_, i) => ({
    id: `rev-${i + 1}`,
    customer_id: `cust-${i + 1}`,
    customer_name: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel'][i % 4],
    product_id: `prod-${(i % 5) + 1}`,
    product_name: ['Business Cards', 'Flyers A5', 'Brochures', 'Banners', 'Stickers'][i % 5],
    order_id: `ord-${2900 - i}`,
    order_number: `ORD-${2900 - i}`,
    rating: Math.floor(3 + (i * 7) % 3),
    title: i % 3 === 0 ? 'Great quality!' : null,
    content: 'The prints came out beautifully. Will definitely order again.',
    images: [],
    status: (['pending', 'published', 'published', 'published', 'rejected'] as const)[i % 5],
    admin_reply: i % 4 === 0 ? 'Thank you for your feedback!' : null,
    admin_reply_at: i % 4 === 0 ? new Date().toISOString() : null,
    created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
  }));
  return { items, total: 47, page: filters.page ?? 1, page_size: filters.page_size ?? 20, total_pages: 3 };
}

export async function updateReviewStatus(id: string, status: 'published' | 'rejected'): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function replyToReview(id: string, reply: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}
