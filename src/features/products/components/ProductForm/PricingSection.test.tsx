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

  it('shows a dash, not the per-unit price, in the Discount cell without an MRP', () => {
    render(<Harness tiers={[tier(100, 9, null)]} />);
    const cell = screen.getByLabelText('Mark pricing tier 1 as best value').closest('tr')?.querySelectorAll('td')[3];
    expect(cell).toHaveTextContent('—');
    expect(cell).not.toHaveTextContent('₹9');
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
    expect(screen.getByText(/keeps the sale price/)).toBeInTheDocument();
  });

  it('shows a non-blocking typo warning when a neighbouring tier differs by more than 10x', () => {
    render(<Harness tiers={[tier(100, 5, null), tier(500, 500, null)]} />);
    const warnings = screen.getAllByTestId('tier-typo-warning');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toHaveTextContent(/more than 10x/);
  });

  it('shows no typo warning for ordinary tiers', () => {
    render(<Harness tiers={[tier(100, 9, null), tier(500, 7, null)]} />);
    expect(screen.queryByTestId('tier-typo-warning')).toBeNull();
  });

  it('re-sorts rows by quantity when a quantity field loses focus', async () => {
    render(<Harness tiers={[tier(100, 9, null), tier(500, 7, null)]} />);
    const q1 = screen.getByLabelText('Quantity for pricing tier 1');
    await act(async () => { fireEvent.change(q1, { target: { value: '900' } }); });
    await act(async () => { fireEvent.blur(q1); });
    expect(latest?.getValues('pricing_tiers').map((t) => t.quantity)).toEqual([500, 900]);
  });
});

describe('PricingSection order quantity panel', () => {
  const tiers = [tier(50, 6, null), tier(100, 4, null)];

  it('shows no pack UI and the new column headers', () => {
    render(<Harness tiers={tiers} />);
    expect(screen.queryByText(/Sold in packs/i)).toBeNull();
    expect(screen.queryByLabelText('Pack size')).toBeNull();
    expect(screen.queryByText(/per pack/i)).toBeNull();
    expect(screen.queryByText(/packis/i)).toBeNull();
    for (const h of ['Quantity from', 'Price per piece (₹)', 'MRP per piece (₹, optional)', 'Example', 'Best value']) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it('shows automatic placeholders and Auto chips derived from the tiers', () => {
    render(<Harness tiers={tiers} />);
    expect(screen.getByLabelText('Show on listing as')).toHaveAttribute('placeholder', '50 (auto: lowest quantity)');
    expect(screen.getByLabelText('Min order')).toHaveAttribute('placeholder', '50 (auto)');
    expect(screen.getByLabelText('Max order')).toHaveAttribute('placeholder', 'No limit');
    expect(screen.getAllByText('Auto')).toHaveLength(3);
    expect(screen.getByTestId('preview-card')).toHaveTextContent('50 pcs for ₹300.00');
    expect(screen.getByTestId('preview-page')).toHaveTextContent('customers can order from 50 pcs');
  });

  it('renders the Example column per tier', () => {
    render(<Harness tiers={tiers} />);
    expect(screen.getAllByTestId('tier-example').map((e) => e.textContent)).toEqual(['50 pcs = ₹300.00', '100 pcs = ₹400.00']);
  });

  it('updates the live preview as limits are typed and resets to auto', async () => {
    render(<Harness tiers={tiers} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Min order'), { target: { value: '40' } }); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Max order'), { target: { value: '5000' } }); });
    expect(screen.getByTestId('preview-card')).toHaveTextContent('40 pcs for ₹240.00');
    expect(screen.getByTestId('preview-page')).toHaveTextContent('customers can order 40 to 5,000 pcs');
    expect(screen.getByTestId('limit-notes')).toHaveTextContent('Orders of 40 to 49 pcs will be charged the 50+ rate');
    expect(latest?.getValues('min_order_quantity')).toBe(40);
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Reset to auto' })[0]); });
    expect(latest?.getValues('min_order_quantity')).toBeNull();
    expect(screen.getByTestId('preview-card')).toHaveTextContent('50 pcs for ₹300.00');
  });

  it('empty limit inputs store null, not NaN', async () => {
    render(<Harness tiers={tiers} />);
    const input = screen.getByLabelText('Min order');
    await act(async () => { fireEvent.change(input, { target: { value: '40' } }); });
    await act(async () => { fireEvent.change(input, { target: { value: '' } }); });
    expect(latest?.getValues('min_order_quantity')).toBeNull();
  });

  it('shows the MRP strike-through and percent in the card preview', () => {
    render(<Harness tiers={[tier(40, 6, 7.5)]} />);
    const card = screen.getByTestId('preview-card');
    expect(card).toHaveTextContent('₹300');
    expect(card).toHaveTextContent('40 pcs for ₹240.00');
    expect(card).toHaveTextContent('20% off');
  });
});
