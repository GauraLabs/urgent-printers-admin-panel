'use client';

import { useEffect } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/formatPrice';
import { DiscountPreview } from './DiscountPreview';
import { priceForPercentOff, hasAtMostTwoDecimals } from '@/lib/utils/discount';
import {
  PACK_SIZE_MAX,
  UNIT_LABEL_SUGGESTIONS,
  normalizePackSize,
  packTierToWire,
  wireTierToPack,
  perPieceRupees,
  optionRoundingNotes,
} from '@/lib/utils/pack';
import { BOUNDS, getTierPriceTypoWarnings, sortTiersByQuantity, type ProductFormValues } from './schema';

interface Props { form: UseFormReturn<ProductFormValues> }

export function PricingSection({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'pricing_tiers' });

  const tiers = watch('pricing_tiers') ?? [];
  const packSize = normalizePackSize(watch('pack_size'));
  const packMode = packSize > 1;
  const unitLabel = watch('unit_label') || 'pcs';
  const optionGroups = [
    ...(watch('sizes') ?? []),
    ...(watch('paper_types') ?? []),
    ...(watch('finishes') ?? []),
    ...(watch('sides_options') ?? []),
  ];
  const roundingNotes = packMode && tiers[0] ? optionRoundingNotes(tiers[0].price_per_unit, packSize, optionGroups) : [];

  function rehydrate(rawSize: number) {
    const n = normalizePackSize(rawSize);
    const current = form.getValues('pricing_tiers') ?? [];
    replace(current.map((t) => {
      const base = { quantity: t.quantity, price_per_unit: t.price_per_unit, mrp_per_unit: t.mrp_per_unit ?? null, is_best_value: t.is_best_value, discount_percent: t.discount_percent, discount_per_unit: t.discount_per_unit };
      return n > 1 ? { ...base, ...wireTierToPack({ quantity: t.quantity, price_per_unit: t.price_per_unit, mrp_per_unit: t.mrp_per_unit ?? null }, n) } : base;
    }));
  }

  const packInputs = JSON.stringify(tiers.map((t) => [t.packs, t.pack_price, t.pack_mrp]));
  useEffect(() => {
    if (packSize <= 1) return;
    (form.getValues('pricing_tiers') ?? []).forEach((t, i) => {
      if (t.packs == null || t.pack_price == null) return;
      const { wire } = packTierToWire({ packs: t.packs, pack_price: t.pack_price, pack_mrp: t.pack_mrp ?? null }, packSize);
      if (!Object.is(wire.quantity, t.quantity)) form.setValue(`pricing_tiers.${i}.quantity`, wire.quantity, { shouldDirty: true });
      if (!Object.is(wire.price_per_unit, t.price_per_unit)) form.setValue(`pricing_tiers.${i}.price_per_unit`, wire.price_per_unit, { shouldDirty: true });
      if (!Object.is(wire.mrp_per_unit, t.mrp_per_unit ?? null)) form.setValue(`pricing_tiers.${i}.mrp_per_unit`, wire.mrp_per_unit, { shouldDirty: true });
    });
  }, [packInputs, packSize, form]);
  const typoWarnings = getTierPriceTypoWarnings(tiers);

  function sortRows() {
    const current = form.getValues('pricing_tiers') ?? [];
    const sorted = sortTiersByQuantity(current);
    if (sorted.some((t, i) => t !== current[i])) replace(sorted);
  }
  const hasAnyMrp = tiers.some((t) => t.mrp_per_unit != null);
  const packErr = errors.pack_size?.message ?? errors.unit_label?.message;

  function applyPercentOff(i: number, raw: string) {
    const mrp = packMode ? tiers[i]?.pack_mrp : tiers[i]?.mrp_per_unit;
    const pct = Number(raw);
    if (raw === '' || mrp == null || !(mrp > 0) || !(pct > 0) || pct >= 100 || !hasAtMostTwoDecimals(pct)) return;
    const price = priceForPercentOff(mrp, pct);
    if (price > 0) setValue(packMode ? `pricing_tiers.${i}.pack_price` : `pricing_tiers.${i}.price_per_unit`, price, { shouldDirty: true, shouldValidate: true });
  }

  function restoreToMrp() {
    tiers.forEach((t, i) => {
      if (t.mrp_per_unit == null) return;
      if (packMode && t.pack_mrp != null) {
        setValue(`pricing_tiers.${i}.pack_price`, t.pack_mrp, { shouldDirty: true, shouldValidate: true });
        setValue(`pricing_tiers.${i}.pack_mrp`, null, { shouldDirty: true, shouldValidate: true });
        return;
      }
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
      <div data-field="pack_size" className="mb-4 rounded-lg border border-[var(--border)] p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-primary)]">
          <label htmlFor="pack-size-input" className="font-medium">Sold in packs of</label>
          <input
            id="pack-size-input"
            {...register('pack_size', { valueAsNumber: true, onChange: (e: { target: { value: string } }) => rehydrate(Number(e.target.value)) })}
            type="number"
            min={1}
            max={PACK_SIZE_MAX}
            step={1}
            aria-label="Pack size"
            className={`${inputCls} w-24`}
          />
          <input
            {...register('unit_label')}
            list="unit-label-suggestions"
            maxLength={30}
            aria-label="Unit label"
            className={`${inputCls} w-32`}
          />
          <datalist id="unit-label-suggestions">
            {UNIT_LABEL_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
          </datalist>
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
          {packMode
            ? `Customers buy whole packs. Enter packs and the price of one pack; prices are stored per ${unitLabel === 'pcs' ? 'piece' : 'unit'}.`
            : 'Leave at 1 to sell by the piece. Set a pack size to sell and price in packs (e.g. 50 stickers per pack).'}
        </p>
        {packErr && <p className={errorCls}>{packErr}</p>}
        {roundingNotes.length > 0 && (
          <p role="status" data-testid="pack-rounding-note" className="mt-1.5 text-[11px] text-[var(--warning)]">
            {roundingNotes.slice(0, 3).map((n) => `Pack price with ${n.label} will round to ${formatPrice(n.packPrice)}`).join('. ')}.
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">{packMode ? 'Packs' : 'Quantity'}</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">{packMode ? 'Price per pack (₹)' : 'Price / unit (₹)'}</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">{packMode ? 'MRP per pack (₹)' : 'MRP / unit (₹)'}</th>
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
                  {packMode ? (
                    <>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.packs`, { valueAsNumber: true, onBlur: sortRows })}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="1"
                      aria-label={`Packs for pricing tier ${i + 1}`}
                      className={`${inputCls} w-24`}
                    />
                    {(errors.pricing_tiers?.[i]?.packs ?? errors.pricing_tiers?.[i]?.quantity) && (
                      <p className={errorCls}>{(errors.pricing_tiers[i]?.packs ?? errors.pricing_tiers[i]?.quantity)?.message}</p>
                    )}
                    <p data-testid="tier-pieces" className="mt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
                      {Number.isFinite(qty) && qty > 0 ? `= ${qty} ${unitLabel}` : ''}
                    </p>
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.pack_price`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min={BOUNDS.PRICE_MIN}
                      placeholder="300.00"
                      aria-label={`Price per pack for pricing tier ${i + 1}`}
                      className={`${inputCls} w-28`}
                    />
                    {(errors.pricing_tiers?.[i]?.pack_price ?? errors.pricing_tiers?.[i]?.price_per_unit) && (
                      <p className={`${errorCls} max-w-[12rem]`}>{(errors.pricing_tiers[i]?.pack_price ?? errors.pricing_tiers[i]?.price_per_unit)?.message}</p>
                    )}
                    <p data-testid="tier-per-piece" className="mt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
                      {(() => {
                        const pp = tiers[i]?.pack_price;
                        const per = pp != null && Number.isFinite(pp) ? perPieceRupees(pp, packSize) : null;
                        return per != null ? `₹${per.toFixed(2)}/${unitLabel === 'pcs' ? 'pc' : 'unit'}` : '';
                      })()}
                    </p>
                    {typoWarnings.filter((w) => w.index === i).map((w) => (
                      <p key={w.index} role="status" data-testid="tier-typo-warning" className="mt-1 max-w-[11rem] text-[11px] text-[var(--warning)]">{w.message}</p>
                    ))}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.pack_mrp`, {
                        setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)),
                      })}
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      aria-label={`MRP per pack for pricing tier ${i + 1}`}
                      className={`${inputCls} w-28`}
                    />
                    {(errors.pricing_tiers?.[i]?.pack_mrp ?? errors.pricing_tiers?.[i]?.mrp_per_unit) && (
                      <p className={`${errorCls} max-w-[12rem]`}>{(errors.pricing_tiers[i]?.pack_mrp ?? errors.pricing_tiers[i]?.mrp_per_unit)?.message}</p>
                    )}
                  </td>
                    </>
                  ) : (
                    <>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.quantity`, { valueAsNumber: true, onBlur: sortRows })}
                      type="number"
                      min={1}
                      max={BOUNDS.QTY_MAX}
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
                      min={BOUNDS.PRICE_MIN}
                      max={BOUNDS.PRICE_MAX}
                      placeholder="5.00"
                      aria-label={`Price per unit for pricing tier ${i + 1}`}
                      className={`${inputCls} w-24`}
                    />
                    {errors.pricing_tiers?.[i]?.price_per_unit && (
                      <p className={errorCls}>{errors.pricing_tiers[i]?.price_per_unit?.message}</p>
                    )}
                    {typoWarnings.filter((w) => w.index === i).map((w) => (
                      <p key={w.index} role="status" data-testid="tier-typo-warning" className="mt-1 max-w-[11rem] text-[11px] text-[var(--warning)]">{w.message}</p>
                    ))}
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
                    </>
                  )}
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
          onClick={() => append(packMode
            ? { quantity: 0, price_per_unit: 0, mrp_per_unit: null, is_best_value: false, packs: 0, pack_price: 0, pack_mrp: null }
            : { quantity: 0, price_per_unit: 0, mrp_per_unit: null, is_best_value: false })}
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
        {packMode ? 'Price per pack' : 'Price / unit'} is the sale price. Blanking an MRP on its own removes the discount but leaves the stored price at the sale price; use
        &ldquo;Restore price to MRP&rdquo; to put the original list price back and clear the sale window.
      </p>
    </div>
  );
}
