import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CouponForm } from './CouponForm';
import type { Coupon } from '@/types';

const mutateAsync = vi.fn();
const render = (ui: React.ReactElement) => rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

vi.mock('../hooks/useCoupons', () => ({ useSaveCoupon: () => ({ mutateAsync, isPending: false }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/categories/hooks/useCategories', () => ({ useCategories: () => ({ data: [{ id: '4', name: 'Cards' }, { id: '5', name: 'Flyers' }] }) }));
vi.mock('@/lib/api/products', () => ({
  getProducts: vi.fn(async () => ({ items: [{ id: '9', name: 'Matte Stickers' }, { id: '10', name: 'Gloss Stickers' }] })),
  getProduct: vi.fn(async (id: string) => ({ id, name: `Product ${id}` })),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const COUPON: Coupon = {
  id: '1', code: 'SAVE10', description: null, discount_type: 'percentage', discount_value: 10,
  min_order_amount: null, max_discount_amount: null, usage_limit: null, usage_count: 0, per_user_limit: null,
  applicable_product_ids: [], applicable_category_ids: [], status: 'active', valid_from: '2026-01-01T00:00:00Z',
  valid_until: null, trigger: null, trigger_config: {}, is_personal: false, applies_to_discounted_items: true,
  is_active: true, created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => { mutateAsync.mockReset(); mutateAsync.mockResolvedValue(COUPON); });

describe('CouponForm: applies_to_discounted_items', () => {
  it('defaults to on for a new coupon', () => {
    render(<CouponForm />);
    expect(screen.getByRole('switch', { name: /Applies to items already on discount/ })).toBeChecked();
  });

  it('reflects the stored value when editing', () => {
    render(<CouponForm coupon={{ ...COUPON, applies_to_discounted_items: false }} />);
    expect(screen.getByRole('switch', { name: /Applies to items already on discount/ })).not.toBeChecked();
  });

  it('sends the default (true) on create', async () => {
    render(<CouponForm />);
    fireEvent.change(screen.getByPlaceholderText('SAVE10'), { target: { value: 'NEW5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].data.applies_to_discounted_items).toBe(true);
  });

  it('sends false after toggling off', async () => {
    render(<CouponForm coupon={COUPON} />);
    fireEvent.click(screen.getByRole('switch', { name: /Applies to items already on discount/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].data.applies_to_discounted_items).toBe(false);
    expect(mutateAsync.mock.calls[0][0].id).toBe('1');
  });
});

describe('CouponForm bounds UX', () => {
  it('warns (without blocking) when a percentage is over 50', () => {
    render(<CouponForm coupon={{ ...COUPON, discount_value: 60 }} />);
    expect(screen.getByTestId('percent-typo-warning')).toHaveTextContent('60%');
  });

  it('shows no warning at or under 50', () => {
    render(<CouponForm coupon={{ ...COUPON, discount_value: 50 }} />);
    expect(screen.queryByTestId('percent-typo-warning')).toBeNull();
  });

  it('highlights an existing out-of-range coupon on load', async () => {
    render(<CouponForm coupon={{ ...COUPON, discount_value: 150 }} />);
    expect(await screen.findByText(/at most 100/)).toBeInTheDocument();
    expect(screen.getByText(/outside the allowed range/)).toBeInTheDocument();
  });

  it('blocks save for an invalid value and does not call the API', async () => {
    render(<CouponForm coupon={{ ...COUPON, discount_value: 150 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByText(/at most 100/);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('maps invalid_coupon_value to a friendly toast', async () => {
    const { toast } = await import('sonner');
    mutateAsync.mockRejectedValueOnce({ status: 422, code: 'invalid_coupon_value', message: 'raw' });
    render(<CouponForm coupon={COUPON} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/outside the allowed range/);
  });
});

function renderForm(coupon?: Coupon) {
  return render(<CouponForm coupon={coupon} />);
}

describe('CouponForm: Applies to', () => {
  it('defaults to All products and saves unscoped with empty id lists', async () => {
    renderForm();
    expect(screen.getByRole('radio', { name: 'All products' })).toBeChecked();
    expect(screen.queryByLabelText('Products')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('SAVE10'), { target: { value: 'NEW5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const d = mutateAsync.mock.calls[0][0].data;
    expect(d.applicable_product_ids).toEqual([]);
    expect(d.applicable_category_ids).toEqual([]);
  });

  it('an existing unscoped coupon loads as All products and saves unchanged', async () => {
    renderForm(COUPON);
    expect(screen.getByTestId('scope-summary')).toHaveTextContent('Applies to all products');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].data.applicable_product_ids).toEqual([]);
  });

  it('loads a scoped coupon, shows the summary and resaves the ids', async () => {
    renderForm({ ...COUPON, applicable_product_ids: ['9', '10', '11'], applicable_category_ids: ['4'] });
    expect(screen.getByRole('radio', { name: 'Specific products or categories' })).toBeChecked();
    expect(screen.getByTestId('scope-summary')).toHaveTextContent('Applies to 3 products and 1 category');
    expect(await screen.findByText('Cards')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const d = mutateAsync.mock.calls[0][0].data;
    expect(d.applicable_product_ids).toEqual(['9', '10', '11']);
    expect(d.applicable_category_ids).toEqual(['4']);
  });

  it('searches and picks a product and a category, and can remove them', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('radio', { name: 'Specific products or categories' }));
    fireEvent.change(screen.getByLabelText('Products'), { target: { value: 'stick' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Matte Stickers' }));
    fireEvent.change(screen.getByLabelText('Categories'), { target: { value: 'fly' } });
    fireEvent.click(screen.getByRole('button', { name: 'Flyers' }));
    expect(screen.getByTestId('scope-summary')).toHaveTextContent('Applies to 1 product and 1 category');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Flyers' }));
    expect(screen.getByTestId('scope-summary')).toHaveTextContent('Applies to 1 product');
  });

  it('blocks saving a specific scope with nothing selected', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('radio', { name: 'Specific products or categories' }));
    fireEvent.change(screen.getByPlaceholderText('SAVE10'), { target: { value: 'NEW5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));
    expect(await screen.findByText(/Pick at least one product or category/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('explains the rules in plain text', () => {
    renderForm();
    expect(screen.getByText(/minimum order still counts the whole cart/)).toBeInTheDocument();
  });
});
