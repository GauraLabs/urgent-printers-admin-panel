import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkDiscountDialog } from './BulkDiscountDialog';
import * as api from '@/lib/api/productDiscounts';
import { toast } from 'sonner';
import type { BulkDiscountPreview, BulkDiscountBatch, ProductSummary } from '@/types';

vi.mock('@/lib/api/productDiscounts');
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));

const mocked = vi.mocked(api);

const PREVIEW: BulkDiscountPreview = {
  dry_run: true, preview_token: 'tok-1', expires_in: 600,
  summary: { matched: 2, changed: 1, skipped: 1 },
  products: [
    { id: '11', name: 'Premium Cards', slug: 'premium-cards', status: 'active', skipped_reason: null, had_existing_discount: false,
      tiers: [{ quantity: 100, before: { mrp_per_unit: null, price_per_unit: 12 }, after: { mrp_per_unit: 12, price_per_unit: 9 }, discount_percent: 25, skipped_reason: null }] },
    { id: '12', name: 'Old Poster', slug: 'old-poster', status: 'archived', skipped_reason: 'archived', had_existing_discount: false, tiers: [] },
  ],
};

const BATCH: BulkDiscountBatch = {
  id: '501', action: 'apply', percent: 25, scope_summary: '2 selected products', created_by: 'Priya', created_at: '2026-10-02T09:30:00Z', undone_at: null,
};

const selected = [{ id: '11', name: 'Premium Cards' }, { id: '12', name: 'Old Poster' }] as unknown as ProductSummary[];

function renderDialog(onOpenChange = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <BulkDiscountDialog
        open onOpenChange={onOpenChange} initialAction="apply" selected={selected}
        categories={[{ id: '3', name: 'Cards' }]}
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

function enterPercentAndPreview(percent = '25') {
  fireEvent.change(screen.getByLabelText(/Percent off/), { target: { value: percent } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getBulkDiscountBatches.mockResolvedValue([BATCH]);
  mocked.previewBulkDiscount.mockResolvedValue(PREVIEW);
  mocked.commitBulkDiscount.mockResolvedValue({ dry_run: false, batch_id: '502', summary: PREVIEW.summary, products: PREVIEW.products });
  mocked.undoBulkDiscount.mockResolvedValue({ batch_id: '502', summary: { matched: 1, changed: 1, skipped: 0 }, products: [] });
});

describe('BulkDiscountDialog', () => {
  it('never commits before a dry run: the first request is a preview', async () => {
    renderDialog();
    expect(screen.queryByRole('button', { name: /^Apply to/ })).toBeNull();
    enterPercentAndPreview();
    await screen.findByTestId('bulk-summary');
    expect(mocked.previewBulkDiscount).toHaveBeenCalledTimes(1);
    expect(mocked.previewBulkDiscount.mock.calls[0][0]).toMatchObject({
      action: 'apply', percent: 25, scope: { product_ids: [11, 12], category_id: null }, overwrite_existing: false,
    });
    expect(mocked.commitBulkDiscount).not.toHaveBeenCalled();
  });

  it('validates the percent client-side without calling the API', async () => {
    renderDialog();
    enterPercentAndPreview('100');
    expect(await screen.findByText(/above 0 and below 100/)).toBeInTheDocument();
    expect(mocked.previewBulkDiscount).not.toHaveBeenCalled();
  });

  it('shows the before/after table with skip reasons, then commits with the preview token', async () => {
    renderDialog();
    enterPercentAndPreview();
    expect(await screen.findByText('Premium Cards')).toBeInTheDocument();
    expect(screen.getByText('25% off')).toBeInTheDocument();
    expect(screen.getByText(/Skipped: Archived product/)).toBeInTheDocument();
    expect(screen.getByTestId('bulk-summary')).toHaveTextContent('2 matched, 1 will change, 1 skipped');

    fireEvent.click(screen.getByRole('button', { name: 'Apply to 1 product' }));
    await waitFor(() => expect(mocked.commitBulkDiscount).toHaveBeenCalledTimes(1));
    const [params, token] = mocked.commitBulkDiscount.mock.calls[0];
    expect(token).toBe('tok-1');
    expect(params).toMatchObject({ action: 'apply', percent: 25 });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [msg, opts] = vi.mocked(toast.success).mock.calls[0] as unknown as [string, { action: { label: string; onClick: () => void } }];
    expect(msg).toBe('Discount applied to 1 product');
    expect(opts.action.label).toBe('Undo');
  });

  it('the toast Undo action calls the undo endpoint with the new batch id', async () => {
    renderDialog();
    enterPercentAndPreview();
    fireEvent.click(await screen.findByRole('button', { name: 'Apply to 1 product' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const opts = vi.mocked(toast.success).mock.calls[0][1] as unknown as { action: { onClick: () => void } };
    opts.action.onClick();
    await waitFor(() => expect(mocked.undoBulkDiscount).toHaveBeenCalledWith('502'));
  });

  it('on 409 preview_stale re-runs the preview, shows a notice, and does not auto-commit', async () => {
    mocked.commitBulkDiscount.mockRejectedValueOnce({ status: 409, code: 'preview_stale', message: 'stale' });
    mocked.previewBulkDiscount
      .mockResolvedValueOnce(PREVIEW)
      .mockResolvedValueOnce({ ...PREVIEW, preview_token: 'tok-2' });
    renderDialog();
    enterPercentAndPreview();
    fireEvent.click(await screen.findByRole('button', { name: 'Apply to 1 product' }));

    expect(await screen.findByText(/Products changed since the last preview/)).toBeInTheDocument();
    expect(mocked.previewBulkDiscount).toHaveBeenCalledTimes(2);
    expect(mocked.commitBulkDiscount).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Apply to 1 product' }));
    await waitFor(() => expect(mocked.commitBulkDiscount).toHaveBeenCalledTimes(2));
    expect(mocked.commitBulkDiscount.mock.calls[1][1]).toBe('tok-2');
  });

  it('recent batches list undoes a batch', async () => {
    renderDialog();
    const btn = await screen.findByRole('button', { name: 'Undo batch 501' });
    fireEvent.click(btn);
    await waitFor(() => expect(mocked.undoBulkDiscount).toHaveBeenCalledWith('501'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('handles already_undone from undo gracefully', async () => {
    mocked.undoBulkDiscount.mockRejectedValueOnce({ status: 409, code: 'already_undone', message: 'x' });
    renderDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Undo batch 501' }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('This batch has already been undone'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows an Undone badge instead of a button for undone batches', async () => {
    mocked.getBulkDiscountBatches.mockResolvedValue([{ ...BATCH, undone_at: '2026-10-02T10:00:00Z' }]);
    renderDialog();
    const list = await screen.findByRole('region', { name: 'Recent batches' });
    await within(list).findByText('Undone');
    expect(within(list).queryByRole('button')).toBeNull();
  });

  it('surfaces discount_window_in_past from the server', async () => {
    mocked.previewBulkDiscount.mockRejectedValueOnce({ status: 422, code: 'discount_window_in_past', message: 'x' });
    renderDialog();
    enterPercentAndPreview();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sale end must be in the future');
  });

  it.each([
    ['scope_too_large', /Too many products/],
    ['products_not_found', /no longer exist/],
  ])('shows a friendly message for %s', async (code, re) => {
    mocked.previewBulkDiscount.mockRejectedValueOnce({ status: 422, code, message: 'raw' });
    renderDialog();
    enterPercentAndPreview();
    expect(await screen.findByRole('alert')).toHaveTextContent(re);
  });

  it('clear action sends no percent or window and hides those inputs', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Clear discount' }));
    expect(screen.queryByLabelText(/Percent off/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await waitFor(() => expect(mocked.previewBulkDiscount).toHaveBeenCalled());
    expect(mocked.previewBulkDiscount.mock.calls[0][0]).toMatchObject({ action: 'clear', percent: null, starts_at: null, ends_at: null });
  });

  it('sends the window as UTC ISO converted from IST, and the overwrite flag', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/Sale ends \(IST/), { target: { value: '2999-01-02T00:15' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Overwrite existing discounts/ }));
    enterPercentAndPreview();
    await waitFor(() => expect(mocked.previewBulkDiscount).toHaveBeenCalled());
    expect(mocked.previewBulkDiscount.mock.calls[0][0]).toMatchObject({
      ends_at: '2999-01-01T18:45:00.000Z', overwrite_existing: true,
    });
  });
});
