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
const PACK_ITEMS = [{ ...product('9', 'none', null), min_price: 5.8, pack_size: 50, unit_label: 'pcs', pricing_tiers: [{ quantity: 100, price_per_unit: 5.8 }, { quantity: 50, price_per_unit: 6 }] }];
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

describe('lowest tier price for pack products', () => {
  it('shows the lowest-quantity tier total, not min unit price x pack size', () => {
    source.items = PACK_ITEMS as unknown as typeof ITEMS;
    renderTable();
    expect(screen.getByTestId('min-price-pack')).toHaveTextContent('₹300 / 50 pcs');
  });
  it('is unchanged for pack size 1', () => {
    renderTable();
    expect(screen.queryByTestId('min-price-pack')).toBeNull();
    expect(screen.getAllByText('₹9').length).toBeGreaterThan(0);
  });
});

describe('DiscountChip', () => {
  it('shows status and max percent', () => {
    render(<DiscountChip product={product('1', 'active', 25)} />);
    expect(screen.getByText('Active · up to 25%')).toBeInTheDocument();
  });
  it.each([
    ['scheduled', 'Scheduled · up to 10%'],
    ['expired', 'Ended · up to 10%'],
  ] as const)('%s', (status, label) => {
    render(<DiscountChip product={product('1', status, 10)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
  it('omits the percent when null or 0', () => {
    render(<DiscountChip product={product('1', 'active', 0)} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  it('renders a dash when there is no discount', () => {
    render(<DiscountChip product={product('1', 'none', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ProductsTable permission gating (products.edit)', () => {
  it('shows the discount column for everyone but no bulk controls without products.edit', () => {
    renderTable();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('Active · up to 25%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bulk discount/ })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Select all' })).toBeNull();
  });

  it('with products.edit: selection checkboxes and the bulk toolbar appear', () => {
    perms.canManageProducts = true;
    renderTable();
    expect(screen.getByRole('button', { name: /Bulk discount/ })).toBeInTheDocument();
    const rowBoxes = screen.getAllByRole('checkbox', { name: 'Select row' });
    expect(rowBoxes).toHaveLength(2);
    fireEvent.click(rowBoxes[0]);
    expect(screen.getByRole('button', { name: /Apply discount/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear discount' })).toBeInTheDocument();
  });

  it('opens the dialog scoped to the selected rows', () => {
    perms.canManageProducts = true;
    renderTable();
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Apply discount/ }));
    expect(screen.getByText('Selected products (1)')).toBeInTheDocument();
  });

  it('labels the raw tier price column and explains it', () => {
    renderTable();
    const header = screen.getByText('Lowest tier price');
    expect(header).toHaveAttribute('title', expect.stringContaining('before size, paper and finish options'));
    expect(header).toHaveAttribute('title', expect.stringContaining('including the cheapest options'));
    expect(screen.queryByText('From')).toBeNull();
  });
});
