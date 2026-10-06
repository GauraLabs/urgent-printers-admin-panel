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

function makeProduct(over: Record<string, unknown> = {}): Product {
  return {
    id: '5', name: 'Cards', slug: 'cards', short_description: 'x', description: null, category_id: '3',
    status: 'draft', badge: 'none', is_featured: false, tags: [], sizes: [], paper_types: [], finishes: [], sides_options: [],
    quantity_steps: [], customization_mode: 'none', template_fields: [], track_inventory: false, stock_quantity: null,
    low_stock_threshold: null, image_keys: ['a', 'b', 'c'], images: [], video_key: null, video_url: null, video_thumbnail_url: null,
    seo: { title: null, description: null, canonical_url: null },
    turnaround_options: [{ type: 'standard', days: 5, extra_cost: 0, is_active: true }],
    pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: 12, is_best_value: false }],
    discount_starts_at: null, discount_ends_at: null, discount: { status: 'none', max_percent: null },
    ...over,
  } as unknown as Product;
}

function renderForm(product: Product) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}><ProductForm product={product} /></QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe('existing out-of-range data', () => {
  it('flags offending fields on load with a clear message, not a generic error', async () => {
    renderForm(makeProduct({
      pricing_tiers: [
        { quantity: 100, price_per_unit: 0, mrp_per_unit: null, is_best_value: false },
        { quantity: 500, price_per_unit: 250000, mrp_per_unit: null, is_best_value: false },
      ],
    }));
    const banner = await screen.findByTestId('out-of-range-banner');
    expect(banner).toHaveTextContent('This value is outside the allowed range. Fix it to save.');
    expect(banner).toHaveTextContent('Pricing tiers #1 price per unit');
    expect(banner).toHaveTextContent('Pricing tiers #2 price per unit');
    expect(screen.getAllByText(/must be at least 0.01/).length).toBeGreaterThan(0);
  });

  it('does not show the banner for valid data', async () => {
    renderForm(makeProduct());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument());
    expect(screen.queryByTestId('out-of-range-banner')).toBeNull();
  });

  it('blocks the save request while the data is invalid', async () => {
    renderForm(makeProduct({ pricing_tiers: [{ quantity: 100, price_per_unit: 0, mrp_per_unit: null, is_best_value: false }] }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByTestId('out-of-range-banner');
    expect(mocked.patch).not.toHaveBeenCalled();
  });
});

describe('product_unpriceable', () => {
  it('shows the friendly message as a toast and in the pricing error slot', async () => {
    mocked.patch.mockRejectedValueOnce({ status: 422, code: 'product_unpriceable', message: 'raw' });
    renderForm(makeProduct());
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    const re = /cheapest combination of tier price and option multipliers/;
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(re);
    expect(await screen.findByText(re)).toBeInTheDocument();
  });
});

describe('coded and field-level server errors', () => {
  it.each([
    ['invalid_option', /invalid or inactive/],
    ['invalid_turnaround', /turnaround option/],
    ['product_unavailable', /not available/],
  ])('maps %s to a friendly toast', async (code, re) => {
    mocked.patch.mockRejectedValueOnce({ status: 422, code, message: 'raw' });
    renderForm(makeProduct());
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(re);
  });

  it('maps a pydantic 422 detail onto the matching field', async () => {
    mocked.patch.mockRejectedValueOnce({
      status: 422, message: 'Pricing tiers #1 price per unit: too high',
      fields: [{ path: 'pricing_tiers.0.price_per_unit', message: 'Input should be less than or equal to 100000' }],
    });
    renderForm(makeProduct());
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Input should be less than or equal to 100000')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Pricing tiers #1 price per unit: too high');
  });
});
