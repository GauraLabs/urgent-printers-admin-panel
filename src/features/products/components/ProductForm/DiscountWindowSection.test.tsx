import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { DiscountWindowSection } from './DiscountWindowSection';
import type { ProductFormValues } from './schema';
import type { ProductDiscountStatus } from '@/types';

let latest: ReturnType<typeof useForm<ProductFormValues>> | null = null;

function Harness({ start, end, status }: { start: string | null; end: string | null; status: ProductDiscountStatus }) {
  const form = useForm<ProductFormValues>({ defaultValues: { discount_starts_at: start, discount_ends_at: end } });
  useEffect(() => { latest = form; });
  return <DiscountWindowSection form={form} status={status} />;
}

describe('DiscountWindowSection', () => {
  it('labels fields as IST and shows stored UTC as IST wall clock', () => {
    render(<Harness start="2026-10-03T06:30:00Z" end={null} status="scheduled" />);
    expect(screen.getByLabelText('Sale starts (IST)')).toHaveValue('2026-10-03T12:00');
    expect(screen.getByLabelText('Sale ends (IST)')).toHaveValue('');
    expect(screen.getByText(/Outside this window, customers pay the MRP/)).toBeInTheDocument();
  });

  it('writes UTC ISO into the form on change', () => {
    render(<Harness start={null} end={null} status="none" />);
    fireEvent.change(screen.getByLabelText('Sale ends (IST)'), { target: { value: '2030-01-02T00:15' } });
    expect(latest?.getValues('discount_ends_at')).toBe('2030-01-01T18:45:00.000Z');
  });

  it('writes null when the field is cleared', () => {
    render(<Harness start={null} end="2030-01-01T00:00:00Z" status="active" />);
    fireEvent.change(screen.getByLabelText('Sale ends (IST)'), { target: { value: '' } });
    expect(latest?.getValues('discount_ends_at')).toBeNull();
  });

  it.each([
    ['scheduled', 'Scheduled'],
    ['active', 'Active'],
    ['expired', 'Ended'],
  ] as const)('shows the %s status chip from the backend value', (status, label) => {
    render(<Harness start={null} end={null} status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows no chip for none', () => {
    render(<Harness start={null} end={null} status="none" />);
    expect(screen.queryByText('Scheduled')).toBeNull();
    expect(screen.queryByText('Active')).toBeNull();
    expect(screen.queryByText('Ended')).toBeNull();
  });
});
