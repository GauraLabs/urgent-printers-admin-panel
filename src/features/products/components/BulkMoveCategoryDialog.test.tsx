import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkMoveCategoryDialog, moveResultMessage } from './BulkMoveCategoryDialog';
import type { ProductSummary } from '@/types';

const mutateAsync = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('../hooks/useProducts', () => ({ useBulkMoveCategory: () => ({ mutateAsync, isPending: false }) }));
vi.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: '2', name: 'Wedding', parent_id: null, sort_order: 1 },
      { id: '5', name: 'Shagun', parent_id: '2', sort_order: 1 },
      { id: '1', name: 'Birthday', parent_id: null, sort_order: 2 },
    ],
  }),
}));

const products = [{ id: '10' }, { id: '11' }] as unknown as ProductSummary[];

function setup(selected = products, onOpenChange = vi.fn(), onDone = vi.fn()) {
  render(<BulkMoveCategoryDialog open onOpenChange={onOpenChange} selected={selected} onDone={onDone} />);
  return { onOpenChange, onDone };
}

beforeEach(() => { mutateAsync.mockReset(); toast.success.mockReset(); toast.error.mockReset(); });

describe('BulkMoveCategoryDialog', () => {
  it('disables Continue until a target is chosen', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('confirmation shows count and target path, then submits ids and reports moved/unchanged', async () => {
    mutateAsync.mockResolvedValue({ category_id: '5', moved: 1, unchanged: 1, moved_product_ids: ['10'] });
    const { onDone } = setup();
    fireEvent.change(screen.getByLabelText('Target category'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Move 2 products to "Wedding > Shagun"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Move 2 products' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ productIds: ['10', '11'], categoryId: '5' });
    expect(toast.success).toHaveBeenCalledWith('Moved 1 product to Wedding > Shagun · 1 already there');
  });

  it('warns when the target is a parent that has children', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Target category'), { target: { value: '2' } });
    expect(screen.getByTestId('parent-category-warning')).toBeInTheDocument();
  });

  it('shows the server error and returns to the picker', async () => {
    mutateAsync.mockRejectedValue({ message: 'Target category not found', status: 422 });
    setup();
    fireEvent.change(screen.getByLabelText('Target category'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move 2 products' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Target category not found'));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('blocks more than 500 products', () => {
    const many = Array.from({ length: 501 }, (_, i) => ({ id: String(i) })) as unknown as ProductSummary[];
    setup(many);
    fireEvent.change(screen.getByLabelText('Target category'), { target: { value: '1' } });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

describe('moveResultMessage', () => {
  it('omits the unchanged part when zero and pluralises', () => {
    expect(moveResultMessage(3, 0, 'A')).toBe('Moved 3 products to A');
  });
});
