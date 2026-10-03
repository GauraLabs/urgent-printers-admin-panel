import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouponForm } from './CouponForm';
import type { Coupon } from '@/types';

const mutateAsync = vi.fn();

vi.mock('../hooks/useCoupons', () => ({ useSaveCoupon: () => ({ mutateAsync, isPending: false }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
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
