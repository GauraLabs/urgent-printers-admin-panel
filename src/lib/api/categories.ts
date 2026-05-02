function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  await delay(300);
  return [
    { id: 'cat-1', name: 'Business Stationery', slug: 'business-stationery', description: 'Cards, letterheads, envelopes', image_url: null, parent_id: null, is_active: true, sort_order: 1, product_count: 12, created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Marketing Materials', slug: 'marketing-materials', description: 'Flyers, brochures, posters', image_url: null, parent_id: null, is_active: true, sort_order: 2, product_count: 8, created_at: new Date().toISOString() },
    { id: 'cat-3', name: 'Signage', slug: 'signage', description: 'Banners, boards, displays', image_url: null, parent_id: null, is_active: true, sort_order: 3, product_count: 6, created_at: new Date().toISOString() },
    { id: 'cat-4', name: 'Stickers & Labels', slug: 'stickers-labels', description: 'Stickers, labels, decals', image_url: null, parent_id: null, is_active: true, sort_order: 4, product_count: 5, created_at: new Date().toISOString() },
  ];
}

export async function getCategory(id: string): Promise<Category> {
  await delay(300);
  const cats = await getCategories();
  return cats.find((c) => c.id === id) ?? cats[0];
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  await delay();
  return { id: `cat-${Date.now()}`, name: data.name ?? '', slug: data.slug ?? '', description: data.description ?? null, image_url: null, parent_id: null, is_active: true, sort_order: 99, product_count: 0, created_at: new Date().toISOString() };
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  await delay();
  return getCategory(id);
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function reorderCategories(ids: string[]): Promise<{ success: boolean }> {
  await delay(200);
  return { success: true };
}
