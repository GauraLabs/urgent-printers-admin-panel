import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductForm } from './index';
import * as client from '@/lib/api/client';
import type { Product } from '@/types';

vi.mock('@/lib/api/client');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/categories/hooks/useCategories', () => ({ useCategories: () => ({ data: [] }) }));
vi.mock('./MediaSection', () => ({ MediaSection: forwardRef(function M() { return <div />; }) }));
vi.mock('./BasicInfoSection', () => ({ BasicInfoSection: () => <div /> }));
vi.mock('./CustomizationSection', () => ({ CustomizationSection: () => <div /> }));
vi.mock('./PrintSpecsSection', () => ({ PrintSpecsSection: () => <div /> }));
vi.mock('./TurnaroundSection', () => ({ TurnaroundSection: () => <div />, normaliseTurnaroundOptions: (o: unknown) => o }));
vi.mock('./InventorySection', () => ({ InventorySection: () => <div /> }));
vi.mock('./SeoSection', () => ({ SeoSection: () => <div /> }));

function product55(): Product {
  return {
    id: '30602', name: 'MrpProd55', slug: 'mrp-prod-55', short_description: '', description: null, category_id: '3',
    status: 'active', badge: 'none', is_featured: false, tags: [], sizes: [], paper_types: [], finishes: [], sides_options: [],
    customization_mode: 'none', template_fields: [], track_inventory: false, stock_quantity: null, low_stock_threshold: null,
    image_keys: null, images: [], video_key: null, seo: null, turnaround_options: [], print_specs: {},
    pack_size: 50, unit_label: 'pcs',
    pricing_tiers: [{ quantity: 100, mrp_per_unit: 12, is_best_value: false, price_per_unit: 9 }],
    discount_starts_at: null, discount_ends_at: null, discount: { status: 'none', max_percent: null },
  } as unknown as Product;
}

beforeEach(() => vi.clearAllMocks());

describe('pack product with empty short description and null image_keys (dev product 30602)', () => {
  it('lists only the genuinely empty field and does not claim a range error', async () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><ProductForm product={product55()} /></QueryClientProvider>);
    const banner = await screen.findByTestId('out-of-range-banner');
    expect(banner).toHaveTextContent('Short description: Short description is required');
    expect(banner).not.toHaveTextContent('outside the allowed range');
    expect(banner).not.toHaveTextContent(/Pricing tiers|Image keys|Seo/);
    expect(banner.querySelectorAll('li')).toHaveLength(1);
  });

  it('keeps unchanged pack tiers byte-identical in the PATCH', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: {} } as never);
    const p = { ...product55(), short_description: 'Short', turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }], image_keys: ['a', 'b', 'c'] } as unknown as Product;
    render(<QueryClientProvider client={new QueryClient()}><ProductForm product={p} /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument());
    expect(screen.queryByTestId('out-of-range-banner')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(client.patch).toHaveBeenCalled());
    const body = vi.mocked(client.patch).mock.calls[0][1] as { pricing_tiers: unknown };
    expect(body.pricing_tiers).toEqual([{ quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false }]);
  });
});
