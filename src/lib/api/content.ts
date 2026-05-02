import type { Banner, Testimonial, Announcement, Faq } from '@/types';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

export async function getBanners(): Promise<Banner[]> {
  await delay();
  return [
    { id: 'b1', title: 'Premium Business Cards', subtitle: 'From ₹499 for 500 cards', image_url: 'https://placehold.co/1200x400/3b82f6/white?text=Banner+1', link_url: '/products/business-cards', link_text: 'Shop Now', is_active: true, sort_order: 1, valid_from: null, valid_until: null, created_at: new Date().toISOString() },
    { id: 'b2', title: 'Rush Printing Available', subtitle: '24-hour turnaround on select products', image_url: 'https://placehold.co/1200x400/ef4444/white?text=Banner+2', link_url: '/products', link_text: 'View Products', is_active: true, sort_order: 2, valid_from: null, valid_until: null, created_at: new Date().toISOString() },
  ];
}

export async function createBanner(data: Partial<Banner>): Promise<Banner> {
  await delay();
  return { id: `b-${Date.now()}`, title: data.title ?? '', subtitle: data.subtitle ?? null, image_url: data.image_url ?? '', link_url: data.link_url ?? null, link_text: data.link_text ?? null, is_active: true, sort_order: 99, valid_from: null, valid_until: null, created_at: new Date().toISOString() };
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
  await delay();
  const banners = await getBanners();
  return { ...banners[0], ...data, id };
}

export async function deleteBanner(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function reorderBanners(ids: string[]): Promise<{ success: boolean }> {
  await delay(200);
  return { success: true };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  await delay();
  return [
    { id: 't1', customer_name: 'Rahul Sharma', customer_title: 'Marketing Manager', avatar_url: null, content: 'Excellent quality prints and super fast delivery!', rating: 5, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
    { id: 't2', customer_name: 'Priya Singh', customer_title: 'Business Owner', avatar_url: null, content: 'Best printing service in Bangalore. Always on time.', rating: 5, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  ];
}

export async function createTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  await delay();
  return { id: `t-${Date.now()}`, customer_name: data.customer_name ?? '', customer_title: null, avatar_url: null, content: data.content ?? '', rating: data.rating ?? 5, is_active: true, sort_order: 99, created_at: new Date().toISOString() };
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial> {
  await delay();
  const list = await getTestimonials();
  return { ...list[0], ...data, id };
}

export async function deleteTestimonial(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function getAnnouncement(): Promise<Announcement | null> {
  await delay(200);
  return { id: 'ann-1', message: 'Free shipping on orders above ₹2,000!', link_url: '/products', link_text: 'Shop Now', bg_color: '#3b82f6', text_color: '#ffffff', is_active: true, valid_from: null, valid_until: null };
}

export async function updateAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  await delay();
  return { id: 'ann-1', message: data.message ?? '', link_url: data.link_url ?? null, link_text: data.link_text ?? null, bg_color: data.bg_color ?? '#3b82f6', text_color: data.text_color ?? '#ffffff', is_active: data.is_active ?? true, valid_from: null, valid_until: null };
}

export async function getFaqs(): Promise<Faq[]> {
  await delay();
  return [
    { id: 'f1', question: 'What file formats do you accept?', answer: 'We accept PDF, AI, PSD, and high-resolution JPEG/PNG files.', category: 'File Requirements', sort_order: 1, is_active: true },
    { id: 'f2', question: 'How long does standard delivery take?', answer: 'Standard delivery takes 5-7 business days after artwork approval.', category: 'Delivery', sort_order: 2, is_active: true },
  ];
}

export async function createFaq(data: Partial<Faq>): Promise<Faq> {
  await delay();
  return { id: `f-${Date.now()}`, question: data.question ?? '', answer: data.answer ?? '', category: data.category ?? null, sort_order: 99, is_active: true };
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  await delay();
  const list = await getFaqs();
  return { ...list[0], ...data, id };
}

export async function deleteFaq(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}
