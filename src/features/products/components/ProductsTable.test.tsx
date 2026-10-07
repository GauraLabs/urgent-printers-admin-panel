import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductsTable, DiscountChip } from './ProductsTable';
import type { ProductSummary, ProductDiscountStatus } from '@/types';

const perms = { canManageProducts: false };

vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => perms }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/features/categories/hooks/useCategories', () => ({ useCategories: () => ({ data: [{ id: '3', name: 'Cards' }] }) }));
vi.mock('../hooks/useBulkDiscount', () => ({
  useBulkDiscountPreview: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkDiscountCommit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkDiscountUndo: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkDiscountBatches: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
}));

function product(id: string, status: ProductDiscountStatus, max: number | null): ProductSummary {
  return {
    id, name: `Product ${id}`, status: 'active', badge: 'none', is_featured: false, category_id: '3',
    primary_image_url: null, min_price: 9, created_at: '2026-01-01T00:00:00Z',
    discount: { status, max_percent: max },
  } as unknown as ProductSummary;
}

const ITEMS = [product('1', 'active', 25), product('2', 'none', null)];
const LEGACY_PACK_ITEMS = [{ ...product('9', 'none', null), min_price: 5.8, pack_size: 50, unit_label: 'pcs', pricing_tiers: [{ quantity: 100, price_per_unit: 5.8 }, { quantity: 50, price_per_unit: 6 }] }];
const source = { items: ITEMS };

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({
    query: { data: { items: source.items, total: source.items.length }, isLoading: false },
    filters: { page: 1, page_size: 20 }, sorting: [], setSorting: vi.fn(), setPage: vi.fn(),
    setSearch: vi.fn(), setStatus: vi.fn(), setCategory: vi.fn(),
  }),
  useDeleteProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderTable() {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><ProductsTable /></QueryClientProvider>);
}

beforeEach(() => { perms.canManageProducts = false; source.items = ITEMS; });

describe('lowest tier price column', () => {
  it('shows the per-piece lowest tier price and no pack display', () => {
    source.items = LEGACY_PACK_ITEMS as unknown as typeof ITEMS;
    renderTable();
    expect(screen.queryByTestId('min-price-pack')).toBeNull();
    expect(screen.getByText('₹5.8')).toBeInTheDocument();
  });
  it('shows the plain price for ordinary products', () => {
    renderTable();
    expect(screen.getAllByText('₹9').length).toBeGreaterThan(0);
  });
});
