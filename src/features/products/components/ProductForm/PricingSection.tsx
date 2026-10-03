'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/formatPrice';
import { DiscountPreview } from './DiscountPreview';
import { priceForPercentOff, hasAtMostTwoDecimals } from '@/lib/utils/discount';
import type { ProductFormValues } from './schema';

interface Props { form: UseFormReturn<ProductFormValues> }

export function PricingSection({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'pricing_tiers' });

  const tiers = watch('pricing_tiers') ?? [];
  const hasAnyMrp = tiers.some((t) => t.mrp_per_unit != null);

  function applyPercentOff(i: number, raw: string) {
    const mrp = tiers[i]?.mrp_per_unit;
    const pct = Number(raw);
    if (raw === '' || mrp == null || !(mrp > 0) || !(pct > 0) || pct >= 100 || !hasAtMostTwoDecimals(pct)) return;
    const price = priceForPercentOff(mrp, pct);
    if (price > 0) setValue(`pricing_tiers.${i}.price_per_unit`, price, { shouldDirty: true, shouldValidate: true });
  }

  function restoreToMrp() {
    tiers.forEach((t, i) => {
      if (t.mrp_per_unit == null) return;
      setValue(`pricing_tiers.${i}.price_per_unit`, t.mrp_per_unit, { shouldDirty: true, shouldValidate: true });
      setValue(`pricing_tiers.${i}.mrp_per_unit`, null, { shouldDirty: true, shouldValidate: true });
    });
    setValue('discount_starts_at', null, { shouldDirty: true });
    setValue('discount_ends_at', null, { shouldDirty: true });
  }
  const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] tabular-nums';
  const errorCls = 'mt-1 text-[11px] text-[var(--danger)]';

  return (
    <div data-field="pricing_tiers">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Quantity</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Price / unit (₹)</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">MRP / unit (₹)</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Discount</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Total (₹)</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Best Value</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {fields.map((field, i) => {
              const qty = tiers[i]?.quantity ?? 0;
              const price = tiers[i]?.price_per_unit ?? 0;
              const total = qty * price;
              return (
                <tr key={field.id}>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.quantity`, { valueAsNumber: true })}
                      type="number"
                      placeholder="500"
                      aria-label={`Quantity for pricing tier ${i + 1}`}
                      className={`${inputCls} w-24`}
                    />
                    {errors.pricing_tiers?.[i]?.quantity && (
                      <p className={errorCls}>{errors.pricing_tiers[i]?.quantity?.message}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.price_per_unit`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      aria-label={`Price per unit for pricing tier ${i + 1}`}
                      className={`${inputCls} w-24`}
                    />
                    {errors.pricing_tiers?.[i]?.price_per_unit && (
                      <p className={errorCls}>{errors.pricing_tiers[i]?.price_per_unit?.message}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.mrp_per_unit`, {
                        setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)),
                      })}
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      aria-label={`MRP per unit for pricing tier ${i + 1}`}
                      className={`${inputCls} w-24`}
                    />
                    {errors.pricing_tiers?.[i]?.mrp_per_unit && (
                      <p className={errorCls}>{errors.pricing_tiers[i]?.mrp_per_unit?.message}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <div className="space-y-1.5">
                      <div className="py-1.5 min-h-[28px]">
                        <DiscountPreview mrp={tiers[i]?.mrp_per_unit} price={price} />
                      </div>
                      {tiers[i]?.mrp_per_unit != null && (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99.99"
                          placeholder="% off"
                          aria-label={`Percent off MRP for pricing tier ${i + 1}`}
                          onChange={(e) => applyPercentOff(i, e.target.value)}
                          className={`${inputCls} w-20`}
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-[var(--text-secondary)] tabular-nums">
                      {total > 0 ? formatPrice(total) : '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        fields.forEach((_, j) => setValue(`pricing_tiers.${j}.is_best_value`, j === i));
                      }}
                      className={tiers[i]?.is_best_value ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-400'}
                      title="Mark as best value"
                      aria-label={`Mark pricing tier ${i + 1} as best value`}
                    >
                      <Star className={`h-4 w-4 ${tiers[i]?.is_best_value ? 'fill-yellow-500' : ''}`} />
                    </button>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                      aria-label={`Remove pricing tier ${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {fields.length === 0 && <p className="text-xs text-[var(--text-muted)] py-3">No pricing tiers yet.</p>}
      {errors.pricing_tiers?.message && <p className={errorCls}>{errors.pricing_tiers.message}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ quantity: 0, price_per_unit: 0, mrp_per_unit: null, is_best_value: false })}
        >
          <Plus className="h-3.5 w-3.5" /> Add Tier
        </Button>
        {hasAnyMrp && (
          <Button type="button" variant="outline" size="sm" onClick={restoreToMrp}>
            <RotateCcw className="h-3.5 w-3.5" /> Restore price to MRP and remove discount
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Price / unit is the sale price. Blanking an MRP on its own removes the discount but leaves the stored price at the sale price; use
        &ldquo;Restore price to MRP&rdquo; to put the original list price back and clear the sale window.
      </p>
    </div>
  );
}
