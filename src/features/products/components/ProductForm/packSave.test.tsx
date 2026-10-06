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

const PACK_PRODUCT = {
  id: '5', name: 'Stickers', slug: 'stickers', short_description: 'x', description: null, category_id: '3',
  status: 'draft', badge: 'none', is_featured: false, tags: [], sizes: [], paper_types: [], finishes: [], sides_options: [],
  quantity_steps: [100, 250], pack_size: 50, unit_label: 'stickers', customization_mode: 'none', template_fields: [],
  track_inventory: false, stock_quantity: null, low_stock_threshold: null, image_keys: ['a', 'b', 'c'], images: [],
  video_key: null, video_url: null, video_thumbnail_url: null,
  seo: { title: null, description: null, canonical_url: null },
  turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }],
  pricing_tiers: [
    { quantity: 50, price_per_unit: 6, mrp_per_unit: 7.5, is_best_value: false },
    { quantity: 100, price_per_unit: 5.8, mrp_per_unit: null, is_best_value: true },
  ],
  discount_starts_at: null, discount_ends_at: null, discount: { status: 'none', max_percent: null },
} as unknown as Product;

function renderForm(product: Product) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={qc}><ProductForm product={product} /></QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe('ProductForm pack product save', () => {
  it('PATCHes the stored per-unit tiers unchanged and omits quantity_steps', async () => {
    mocked.patch.mockResolvedValueOnce(PACK_PRODUCT);
    renderForm(PACK_PRODUCT);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mocked.patch).toHaveBeenCalledTimes(1));
    const body = mocked.patch.mock.calls[0][1] as Record<string, unknown>;
    expect(body.pack_size).toBe(50);
    expect(body.unit_label).toBe('stickers');
    expect(body.pricing_tiers).toEqual([
      { quantity: 50, price_per_unit: 6, mrp_per_unit: 7.5, is_best_value: false },
      { quantity: 100, price_per_unit: 5.8, mrp_per_unit: null, is_best_value: true },
    ]);
    expect('quantity_steps' in body).toBe(false);
  });

  it('blocks the save and shows the exactness error for ₹100 per pack of 30', async () => {
    renderForm({ ...PACK_PRODUCT, pack_size: 30, pricing_tiers: [{ quantity: 30, price_per_unit: 3.3, mrp_per_unit: null, is_best_value: false }] } as unknown as Product);
    fireEvent.change(screen.getByLabelText('Price per pack for pricing tier 1'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('₹100 per pack does not divide into whole paise per piece at pack size 30')).toBeInTheDocument();
    expect(mocked.patch).not.toHaveBeenCalled();
  });

  it('maps pack_size_tier_mismatch onto the pack size field', async () => {
    mocked.patch.mockRejectedValueOnce({ status: 422, code: 'pack_size_tier_mismatch', message: 'Tier quantities not multiples of 50: 120' });
    renderForm(PACK_PRODUCT);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Tier quantities not multiples of 50: 120')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });
});
