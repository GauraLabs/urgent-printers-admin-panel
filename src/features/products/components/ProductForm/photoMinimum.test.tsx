import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductForm } from './index';
import * as client from '@/lib/api/client';
import { toast } from 'sonner';
import type { Product } from '@/types';

vi.mock('@/lib/api/client');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/categories/hooks/useCategories', () => ({ useCategories: () => ({ data: [{ id: '3', name: 'Cards', slug: 'cards' }] }) }));
vi.mock('./MediaSection', () => ({ MediaSection: forwardRef(function MediaSection() { return <div />; }) }));
vi.mock('./BasicInfoSection', () => ({ BasicInfoSection: () => <div /> }));
vi.mock('./CustomizationSection', () => ({ CustomizationSection: () => <div /> }));
vi.mock('./PrintSpecsSection', () => ({ PrintSpecsSection: () => <div /> }));
vi.mock('./TurnaroundSection', () => ({ TurnaroundSection: () => <div />, normaliseTurnaroundOptions: (o: unknown) => o }));
vi.mock('./InventorySection', () => ({ InventorySection: () => <div /> }));
vi.mock('./SeoSection', () => ({ SeoSection: () => <div /> }));

const mocked = vi.mocked(client);

const STICKERS = {
  id: '5', name: 'Stickers', slug: 'stickers', short_description: 'x', description: null, category_id: '3',
  status: 'draft', badge: 'none', is_featured: false, tags: [], sizes: [], paper_types: [], finishes: [], sides_options: [],
  quantity_steps: [100, 250], unit_label: 'pcs', listing_quantity: null, min_order_quantity: null, max_order_quantity: null,
  customization_mode: 'none', template_fields: [],
  track_inventory: false, stock_quantity: null, low_stock_threshold: null, image_keys: ['only-photo'], images: [],
  video_key: null, video_url: null, video_thumbnail_url: null,
  seo: { title: null, description: null, canonical_url: null },
  turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }],
  pricing_tiers: [
    { quantity: 50, price_per_unit: 6, mrp_per_unit: 7.5, is_best_value: false },
    { quantity: 100, price_per_unit: 4, mrp_per_unit: null, is_best_value: true },
    { quantity: 150, price_per_unit: 3.4, mrp_per_unit: null, is_best_value: false },
    { quantity: 200, price_per_unit: 3, mrp_per_unit: null, is_best_value: false },
  ],
  discount_starts_at: null, discount_ends_at: null, discount: { status: 'none', max_percent: null },
} as unknown as Product;

function renderForm(product: Product) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={qc}><ProductForm product={product} /></QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe('ProductForm photo minimum', () => {
  it.each([
    ['Save Changes', 'active'],
    ['Save as Draft', 'draft'],
  ])('saves a product with a single photo via %s', async (button, status) => {
    mocked.patch.mockResolvedValueOnce(STICKERS);
    renderForm(STICKERS);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => expect(mocked.patch).toHaveBeenCalledTimes(1));
    const body = mocked.patch.mock.calls[0][1] as Record<string, unknown>;
    expect(body.image_keys).toEqual(['only-photo']);
    expect(body.status).toBe(status);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it.each(['Save Changes', 'Save as Draft'])('blocks %s when there are no photos', async (button) => {
    renderForm({ ...STICKERS, image_keys: [] } as unknown as Product);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('At least 1 photo is required'));
    expect(mocked.patch).not.toHaveBeenCalled();
  });
});
