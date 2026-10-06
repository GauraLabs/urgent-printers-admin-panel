import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { PricingSection } from './PricingSection';
import { hydrateTiers, type ProductFormValues } from './schema';

let latest: ReturnType<typeof useForm<ProductFormValues>> | null = null;

function Harness({ packSize, tiers }: { packSize: number; tiers: Array<{ quantity: number; price_per_unit: number; mrp_per_unit: number | null }> }) {
  const form = useForm<ProductFormValues>({
    defaultValues: {
      pack_size: packSize,
      unit_label: 'stickers',
      pricing_tiers: hydrateTiers(tiers.map((t) => ({ ...t, is_best_value: false })), packSize),
    },
  });
  useEffect(() => { latest = form; });
  return <PricingSection form={form} />;
}

const stored = [{ quantity: 50, price_per_unit: 6, mrp_per_unit: null }, { quantity: 100, price_per_unit: 5.8, mrp_per_unit: null }];

describe('PricingSection pack mode', () => {
  it('looks like today at pack size 1', () => {
    render(<Harness packSize={1} tiers={stored} />);
    expect(screen.getByLabelText('Quantity for pricing tier 1')).toHaveValue(50);
    expect(screen.getByLabelText('Price per unit for pricing tier 1')).toHaveValue(6);
    expect(screen.queryByLabelText('Packs for pricing tier 1')).toBeNull();
  });

  it('hydrates stored per-unit tiers as packs and price per pack', () => {
    render(<Harness packSize={50} tiers={stored} />);
    expect(screen.getByLabelText('Packs for pricing tier 1')).toHaveValue(1);
    expect(screen.getByLabelText('Price per pack for pricing tier 1')).toHaveValue(300);
    expect(screen.getByLabelText('Packs for pricing tier 2')).toHaveValue(2);
    expect(screen.getByLabelText('Price per pack for pricing tier 2')).toHaveValue(290);
    expect(screen.getAllByTestId('tier-pieces')[1]).toHaveTextContent('= 100 stickers');
    expect(screen.getAllByTestId('tier-per-piece')[0]).toHaveTextContent('₹6.00/unit');
  });

  it('editing a pack price writes the per-unit wire value', async () => {
    render(<Harness packSize={50} tiers={stored} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Price per pack for pricing tier 1'), { target: { value: '275' } }); });
    expect(latest?.getValues('pricing_tiers.0.price_per_unit')).toBe(5.5);
    expect(latest?.getValues('pricing_tiers.0.quantity')).toBe(50);
  });

  it('editing packs writes the quantity in pieces', async () => {
    render(<Harness packSize={50} tiers={stored} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Packs for pricing tier 1'), { target: { value: '4' } }); });
    expect(latest?.getValues('pricing_tiers.0.quantity')).toBe(200);
  });

  it('shows per-piece text only when the pack price divides into whole paise', async () => {
    render(<Harness packSize={30} tiers={[{ quantity: 30, price_per_unit: 3.3, mrp_per_unit: null }]} />);
    const price = screen.getByLabelText('Price per pack for pricing tier 1');
    expect(screen.getByTestId('tier-per-piece')).toHaveTextContent('₹3.30/unit');
    await act(async () => { fireEvent.change(price, { target: { value: '100' } }); });
    expect(screen.getByTestId('tier-per-piece')).toHaveTextContent('');
  });

  it('changing the pack size re-expresses the same stored tiers without changing the wire', async () => {
    render(<Harness packSize={50} tiers={stored} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Pack size'), { target: { value: '25' } }); });
    expect(screen.getByLabelText('Packs for pricing tier 1')).toHaveValue(2);
    expect(screen.getByLabelText('Price per pack for pricing tier 1')).toHaveValue(150);
    expect(latest?.getValues('pricing_tiers.0.price_per_unit')).toBe(6);
    expect(latest?.getValues('pricing_tiers.0.quantity')).toBe(50);
  });

  it('setting the pack size back to 1 returns to per-unit entry with the same values', async () => {
    render(<Harness packSize={50} tiers={stored} />);
    await act(async () => { fireEvent.change(screen.getByLabelText('Pack size'), { target: { value: '1' } }); });
    expect(screen.getByLabelText('Quantity for pricing tier 1')).toHaveValue(50);
    expect(screen.getByLabelText('Price per unit for pricing tier 1')).toHaveValue(6);
  });

  it('shows a non-blocking rounding hint when an option multiplier does not stay exact', () => {
    function WithOption() {
      const form = useForm<ProductFormValues>({
        defaultValues: {
          pack_size: 50, unit_label: 'pcs',
          pricing_tiers: hydrateTiers([{ quantity: 50, price_per_unit: 6.01, mrp_per_unit: null, is_best_value: false }], 50),
          finishes: [{ label: 'Matte', is_active: true, is_default: true, price_multiplier: 1.05 }],
        },
      });
      return <PricingSection form={form} />;
    }
    render(<WithOption />);
    expect(screen.getByTestId('pack-rounding-note')).toHaveTextContent('Pack price with Matte will round to ₹315.5');
  });
});
