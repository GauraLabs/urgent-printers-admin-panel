import type { Product, ProductSummary, ProductsListResponse, ProductFilters } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

const PRODUCT_NAMES = [
  'Business Cards Premium', 'Flyers A5 Gloss', 'Brochures A4 Trifold',
  'Banners 4x2 ft', 'Visiting Cards Matte', 'Letterheads A4',
  'Posters A3', 'Stickers Round', 'Envelopes DL', 'Bookmarks',
];

function makeProductSummary(i: number): ProductSummary {
  return {
    id: `prod-${i + 1}`,
    name: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
    slug: PRODUCT_NAMES[i % PRODUCT_NAMES.length].toLowerCase().replace(/\s+/g, '-'),
    category_name: ['Business Stationery', 'Marketing Materials', 'Signage'][i % 3],
    status: (['active', 'active', 'active', 'draft', 'archived'] as const)[i % 5],
    badge: ([null, 'bestseller', 'new', null, 'popular'] as const)[i % 5],
    is_featured: i % 4 === 0,
    primary_image_url: null,
    min_price: Math.floor(500 + (i * 317) % 5000),
    total_orders: Math.floor(20 + (i * 137) % 400),
    total_revenue: Math.floor(50000 + (i * 11317) % 500000),
    created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 24 * 7).toISOString(),
  };
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsListResponse> {
  await delay();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const total = 38;
  const items = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) =>
    makeProductSummary((page - 1) * pageSize + i)
  );
  return { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) };
}

export async function getProduct(id: string): Promise<Product> {
  await delay();
  const i = parseInt(id.replace('prod-', '') || '1') - 1;
  const summary = makeProductSummary(i);
  return {
    ...summary,
    short_description: 'High quality printing with fast turnaround.',
    description: '<p>Professional quality prints for your business needs.</p>',
    category_id: `cat-${(i % 3) + 1}`,
    tags: ['printing', 'business', 'professional'],
    images: [],
    sizes: [
      { id: 's1', label: '90mm x 54mm', width_mm: 90, height_mm: 54, is_active: true },
      { id: 's2', label: '85mm x 55mm', width_mm: 85, height_mm: 55, is_active: true },
    ],
    paper_types: [
      { id: 'pt1', label: '300 GSM Art Board', gsm: 300, is_active: true },
      { id: 'pt2', label: '350 GSM Art Board', gsm: 350, is_active: true },
    ],
    finishes: [
      { id: 'f1', label: 'Matte Lamination', is_active: true },
      { id: 'f2', label: 'Gloss Lamination', is_active: true },
    ],
    sides_options: ['Single Sided', 'Double Sided'],
    quantity_steps: [100, 250, 500, 1000, 2500, 5000],
    pricing_tiers: [
      { id: 'tier1', quantity: 100, price_per_unit: 8, is_best_value: false },
      { id: 'tier2', quantity: 500, price_per_unit: 5, is_best_value: true },
      { id: 'tier3', quantity: 1000, price_per_unit: 3.5, is_best_value: false },
    ],
    turnaround_options: [
      { type: 'standard', days: 5, extra_cost: 0, is_active: true },
      { type: 'express', days: 3, extra_cost: 200, is_active: true },
      { type: 'rush', days: 1, extra_cost: 500, is_active: true },
    ],
    seo: { title: null, description: null, canonical_url: null },
    updated_at: new Date().toISOString(),
  };
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  await delay();
  return getProduct('prod-999');
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  await delay();
  return getProduct(id);
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}
