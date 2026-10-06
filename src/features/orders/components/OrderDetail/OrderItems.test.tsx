import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderItems } from './OrderItems';
import type { OrderItem } from '@/types';

function item(over: Partial<OrderItem> = {}): OrderItem {
  return {
    id: '1', product_id: '9', product_name: 'Cards', product_slug: 'cards', thumbnail_url: null, category_name: null,
    size_label: null, paper_label: null, finish_label: null, sides: null, turnaround_label: null,
    quantity: 100, pack_size: 1, unit_label: 'pcs', price_per_unit: 9, mrp_per_unit: null, discount_per_unit: null, line_savings: null,
    turnaround_extra_cost: 0, total_price: 900, artwork_status: 'pending' as OrderItem['artwork_status'],
    artwork_file_key: null, artwork_filename: null, artwork_type: null, template_data: null,
    ...over,
  };
}

describe('OrderItems MRP and savings', () => {
  it('shows MRP struck through and savings when the line was discounted', () => {
    render(<OrderItems items={[item({ mrp_per_unit: 12, discount_per_unit: 3, line_savings: 300 })]} />);
    expect(screen.getByTestId('line-mrp')).toHaveTextContent('₹12');
    expect(screen.getByTestId('line-savings')).toHaveTextContent('Saved ₹300 on MRP');
  });

  it('shows neither for an undiscounted line (old orders have null)', () => {
    render(<OrderItems items={[item()]} />);
    expect(screen.queryByTestId('line-mrp')).toBeNull();
    expect(screen.queryByTestId('line-savings')).toBeNull();
  });

  it('shows neither when savings are zero', () => {
    render(<OrderItems items={[item({ mrp_per_unit: 9, discount_per_unit: 0, line_savings: 0 })]} />);
    expect(screen.queryByTestId('line-mrp')).toBeNull();
    expect(screen.queryByTestId('line-savings')).toBeNull();
  });
});

describe('OrderItems pack display', () => {
  it('shows packs and pieces for a pack line', () => {
    render(<OrderItems items={[item({ quantity: 150, pack_size: 50, unit_label: 'stickers', price_per_unit: 6, total_price: 900 })]} />);
    expect(screen.getByTestId('line-packs')).toHaveTextContent('3 packs (150 stickers)');
  });

  it('shows nothing extra for pack size 1', () => {
    render(<OrderItems items={[item()]} />);
    expect(screen.queryByTestId('line-packs')).toBeNull();
  });
});
