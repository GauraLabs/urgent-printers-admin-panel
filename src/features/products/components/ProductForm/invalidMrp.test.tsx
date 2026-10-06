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

const PRODUCT = {
  id: '5', name: 'Cards', slug: 'cards', short_description: 'x', description: null, category_id: '3',
  status: 'draft', badge: 'none', is_featured: false, tags: [], sizes: [], paper_types: [], finishes: [], sides_options: [],
  quantity_steps: [], customization_mode: 'none', template_fields: [], track_inventory: false, stock_quantity: null,
  low_stock_threshold: null, image_keys: ['a', 'b', 'c'], images: [], video_key: null, video_url: null, video_thumbnail_url: null,
  seo: { title: null, description: null, canonical_url: null },
  turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }],
  pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false }],
  discount_starts_at: null, discount_ends_at: null, discount: { status: 'none', max_percent: null },
} as unknown as Product;

beforeEach(() => vi.clearAllMocks());

describe('ProductForm invalid_mrp handling', () => {
  it('toasts and shows the message in the pricing_tiers error slot on a 422 invalid_mrp', async () => {
    mocked.patch.mockRejectedValueOnce({ status: 422, code: 'invalid_mrp', message: 'raw backend text' });
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={qc}><ProductForm product={PRODUCT} /></QueryClientProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    const msg = 'MRP must be greater than the selling price and have at most 2 decimal places';
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(msg));
    expect(mocked.patch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(msg)).toBeInTheDocument();
    expect(screen.queryByText('raw backend text')).toBeNull();
  });
});
