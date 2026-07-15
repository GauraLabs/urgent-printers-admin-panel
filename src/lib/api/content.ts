import { get, post, patch, put, del } from './client';
import type { Banner, Testimonial, Announcement, Faq } from '@/types';

interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Content lists are small and unpaginated in the UI — fetch one large page.
const LIST_PAGE_SIZE = 100;

function emptyToNull(v: string | null | undefined): string | null {
  return v ? v : null;
}

// ── Banners ──────────────────────────────────────────────────────────────────
type RawBanner = Omit<Banner, 'id'> & { id: number | string };

function normalizeBanner(raw: RawBanner): Banner {
  return { ...raw, id: String(raw.id) };
}

function toBannerPayload(data: Partial<Banner>): Partial<Banner> {
  return {
    ...data,
    valid_from: emptyToNull(data.valid_from),
    valid_until: emptyToNull(data.valid_until),
  };
}

export async function getBanners(): Promise<Banner[]> {
  const res = await get<PaginatedResponse<RawBanner>>('/admin/content/banners', {
    page: 1,
    page_size: LIST_PAGE_SIZE,
  });
  return res.items.map(normalizeBanner);
}

export async function createBanner(data: Partial<Banner>): Promise<Banner> {
  const raw = await post<RawBanner>('/admin/content/banners', toBannerPayload(data));
  return normalizeBanner(raw);
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
  const raw = await patch<RawBanner>(`/admin/content/banners/${id}`, toBannerPayload(data));
  return normalizeBanner(raw);
}

export async function deleteBanner(id: string): Promise<{ success: boolean }> {
  await del<void>(`/admin/content/banners/${id}`);
  return { success: true };
}

export async function reorderBanners(ids: string[]): Promise<{ success: boolean }> {
  await post<{ reordered: number }>('/admin/content/banners/reorder', { ids: ids.map(Number) });
  return { success: true };
}

// ── Testimonials ─────────────────────────────────────────────────────────────
type RawTestimonial = Omit<Testimonial, 'id'> & { id: number | string };

function normalizeTestimonial(raw: RawTestimonial): Testimonial {
  return { ...raw, id: String(raw.id) };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await get<PaginatedResponse<RawTestimonial>>('/admin/content/testimonials', {
    page: 1,
    page_size: LIST_PAGE_SIZE,
  });
  return res.items.map(normalizeTestimonial);
}

export async function createTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  const raw = await post<RawTestimonial>('/admin/content/testimonials', data);
  return normalizeTestimonial(raw);
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial> {
  const raw = await patch<RawTestimonial>(`/admin/content/testimonials/${id}`, data);
  return normalizeTestimonial(raw);
}

export async function deleteTestimonial(id: string): Promise<{ success: boolean }> {
  await del<void>(`/admin/content/testimonials/${id}`);
  return { success: true };
}

// ── Announcement (single-row-in-practice) ────────────────────────────────────
// AdminAnnouncementResponse carries no valid_from/valid_until — those fields
// exist on the frontend Announcement type but the backend never populates or
// accepts them for this resource, so they're always normalized to null here.
// countdown_end_at IS a real backend field (unlike valid_from/valid_until) —
// it must pass through raw untouched, not get folded into that null-out.
type RawAnnouncement = Omit<Announcement, 'id' | 'valid_from' | 'valid_until'> & { id: number | string };

function normalizeAnnouncement(raw: RawAnnouncement): Announcement {
  return { ...raw, id: String(raw.id), valid_from: null, valid_until: null };
}

export async function getAnnouncement(): Promise<Announcement | null> {
  const raw = await get<RawAnnouncement | null>('/admin/content/announcement');
  return raw ? normalizeAnnouncement(raw) : null;
}

export async function updateAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const raw = await put<RawAnnouncement>('/admin/content/announcement', data);
  return normalizeAnnouncement(raw);
}

// ── FAQs ─────────────────────────────────────────────────────────────────────
type RawFaq = Omit<Faq, 'id'> & { id: number | string };

function normalizeFaq(raw: RawFaq): Faq {
  return { ...raw, id: String(raw.id) };
}

export async function getFaqs(): Promise<Faq[]> {
  const res = await get<PaginatedResponse<RawFaq>>('/admin/content/faqs', {
    page: 1,
    page_size: LIST_PAGE_SIZE,
  });
  return res.items.map(normalizeFaq);
}

export async function createFaq(data: Partial<Faq>): Promise<Faq> {
  const raw = await post<RawFaq>('/admin/content/faqs', data);
  return normalizeFaq(raw);
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  const raw = await patch<RawFaq>(`/admin/content/faqs/${id}`, data);
  return normalizeFaq(raw);
}

export async function deleteFaq(id: string): Promise<{ success: boolean }> {
  await del<void>(`/admin/content/faqs/${id}`);
  return { success: true };
}

export async function reorderFaqs(ids: string[]): Promise<{ success: boolean }> {
  await post<{ reordered: number }>('/admin/content/faqs/reorder', { ids: ids.map(Number) });
  return { success: true };
}
