import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { BasicInfoSection } from './ProductForm/BasicInfoSection';
import type { ProductFormValues } from './ProductForm/schema';

vi.mock('@/features/categories/hooks/useCategories', () => ({ useCategories: () => ({ data: [] }) }));
vi.mock('@/components/common/RichTextEditor', () => ({ RichTextEditor: () => <div /> }));

function Harness({ badge }: { badge: string }) {
  const form = useForm<ProductFormValues>({ defaultValues: { name: 'x', slug: 'x', badge, tags: [] } });
  return <BasicInfoSection form={form} mode="edit" />;
}

describe('badge selector', () => {
  it('does not offer a manual Sale option', () => {
    render(<Harness badge="none" />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['None', 'Bestseller', 'New', 'Popular']));
    expect(options.some((t) => /sale/i.test(t ?? ''))).toBe(false);
  });

  it('keeps displaying a stored sale value, read-only (disabled option)', () => {
    render(<Harness badge="sale" />);
    const select = screen.getByLabelText('Badge') as HTMLSelectElement;
    expect(select.value).toBe('sale');
    const legacy = screen.getByRole('option', { name: /Sale \(legacy, read-only\)/ }) as HTMLOptionElement;
    expect(legacy.disabled).toBe(true);
  });
});
