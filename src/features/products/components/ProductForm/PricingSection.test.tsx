import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { PricingSection } from './PricingSection';
import type { ProductFormValues } from './schema';

type Tier = ProductFormValues['pricing_tiers'][number];

let latest: ReturnType<typeof useForm<ProductFormValues>> | null = null;

function Harness({ tiers }: { tiers: Tier[] }) {
  const form = useForm<ProductFormValues>({
    defaultValues: { pricing_tiers: tiers, discount_starts_at: '2030-01-01T00:00:00.000Z', discount_ends_at: '2030-02-01T00:00:00.000Z' },
  });
  useEffect(() => { latest = form; });
  return <PricingSection form={form} />;
}

const tier = (quantity: number, price: number, mrp: number | null): Tier => ({
  quantity, price_per_unit: price, mrp_per_unit: mrp, is_best_value: false,
});

describe('PricingSection discount column', () => {
  it('shows struck MRP, percent badge and price for a discounted tier', () => {
    render(<Harness tiers={[tier(100, 9, 12)]} />);
    const preview = screen.getByTestId('discount-preview');
    expect(preview).toHaveTextContent('25% off');
    expect(preview.querySelector('s')).toHaveTextContent('₹12');
  });

  it.each([
    [3, 2, '33% off'],
    [7, 6.5, '7% off'],
    [200, 199, '1% off'],
    [10, 5.5, '45% off'],
  ])('golden vector mrp %s price %s -> %s', (mrp, price, text) => {
    render(<Harness tiers={[tier(100, price, mrp)]} />);
    expect(screen.getByTestId('discount-preview')).toHaveTextContent(text);
  });

  it('hides the badge at 0% (1000 vs 996)', () => {
    render(<Harness tiers={[tier(100, 996, 1000)]} />);
    expect(screen.queryByTestId('discount-preview')).toBeNull();
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it('shows no preview when the tier has no MRP', () => {
    render(<Harness tiers={[tier(100, 9, null)]} />);
    expect(screen.queryByTestId('discount-preview')).toBeNull();
  });

  it('percent-off helper fills the selling price', () => {
    render(<Harness tiers={[tier(100, 12, 12)]} />);
    fireEvent.change(screen.getByLabelText('Percent off MRP for pricing tier 1'), { target: { value: '25' } });
    expect(latest?.getValues('pricing_tiers.0.price_per_unit')).toBe(9);
  });

  it('restore action puts price back to MRP, clears MRP and the window', () => {
    render(<Harness tiers={[tier(100, 9, 12), tier(500, 7, null)]} />);
    fireEvent.click(screen.getByRole('button', { name: /Restore price to MRP/ }));
    expect(latest?.getValues('pricing_tiers.0.price_per_unit')).toBe(12);
    expect(latest?.getValues('pricing_tiers.0.mrp_per_unit')).toBeNull();
    expect(latest?.getValues('pricing_tiers.1.price_per_unit')).toBe(7);
    expect(latest?.getValues('discount_starts_at')).toBeNull();
    expect(latest?.getValues('discount_ends_at')).toBeNull();
  });

  it('hides the restore action when no tier has an MRP', () => {
    render(<Harness tiers={[tier(100, 9, null)]} />);
    expect(screen.queryByRole('button', { name: /Restore price to MRP/ })).toBeNull();
  });

  it('typing a blank MRP stores null, not NaN', async () => {
    render(<Harness tiers={[tier(100, 9, 12)]} />);
    const input = screen.getByLabelText('MRP per unit for pricing tier 1');
    await act(async () => { fireEvent.change(input, { target: { value: '' } }); });
    expect(latest?.getValues('pricing_tiers.0.mrp_per_unit')).toBeNull();
  });

  it('warns that blanking the MRP alone leaves the sale price', () => {
    render(<Harness tiers={[tier(100, 9, 12)]} />);
    expect(screen.getByText(/leaves the stored price at the sale price/)).toBeInTheDocument();
  });
});
