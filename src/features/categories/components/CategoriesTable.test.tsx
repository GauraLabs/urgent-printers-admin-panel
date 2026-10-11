import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoriesTable } from './CategoriesTable';

const reorder = vi.fn().mockResolvedValue({ success: true });
const del = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

const base = { description: null, is_active: true, images: [], product_count: 0, total_product_count: 0, children_count: 0 };
const DATA = [
  { ...base, id: '1', name: 'Birthday', slug: 'birthday', parent_id: null, sort_order: 2 },
  { ...base, id: '2', name: 'Wedding', slug: 'wedding', parent_id: null, sort_order: 1, product_count: 0, total_product_count: 37, children_count: 2 },
  { ...base, id: '5', name: 'Shagun', slug: 'shagun', parent_id: '2', sort_order: 1, product_count: 8, total_product_count: 8 },
  { ...base, id: '4', name: 'Essentials', slug: 'essentials', parent_id: '2', sort_order: 2, product_count: 7, total_product_count: 7 },
];

vi.mock('sonner', () => ({ toast }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({ data: DATA, isLoading: false }),
  useDeleteCategory: () => ({ mutateAsync: del, isPending: false }),
  useReorderCategories: () => ({ mutateAsync: reorder }),
}));

const names = () => screen.getAllByRole('link').filter((a) => a.className.includes('font-semibold')).map((a) => a.textContent);

describe('CategoriesTable tree', () => {
  it('renders parents before indented children', () => {
    render(<CategoriesTable />);
    expect(names()).toEqual(['Wedding', 'Shagun', 'Essentials', 'Birthday']);
    expect(screen.getByText('Shagun').closest('[data-depth]')).toHaveAttribute('data-depth', '1');
    expect(screen.getByText('Wedding').closest('[data-depth]')).toHaveAttribute('data-depth', '0');
    expect(screen.getByText(/37 total/)).toBeInTheDocument();
  });

  it('collapses and expands children', () => {
    render(<CategoriesTable />);
    fireEvent.click(screen.getByLabelText('Collapse Wedding'));
    expect(names()).toEqual(['Wedding', 'Birthday']);
    fireEvent.click(screen.getByLabelText('Expand Wedding'));
    expect(names()).toHaveLength(4);
  });

  it('reorders only among siblings', () => {
    render(<CategoriesTable />);
    fireEvent.click(screen.getByLabelText('Move Essentials up'));
    expect(reorder).toHaveBeenCalledWith(['4', '5']);
    reorder.mockClear();
    fireEvent.click(screen.getByLabelText('Move Wedding down'));
    expect(reorder).toHaveBeenCalledWith(['1', '2']);
  });
});
