'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiscountPreview } from './DiscountPreview';
import { priceForPercentOff, hasAtMostTwoDecimals } from '@/lib/utils/discount';
import { UNIT_LABEL_SUGGESTIONS } from '@/lib/utils/unitLabel';
import {
  cardPreviewText,
  effectiveLimits,
  exampleText,
  limitNotes,
  listingPreview,
  saleState,
  saleStateNote,
  minOptionMultipliers,
  pagePreviewText,
} from '@/lib/utils/orderQuantity';
import { formatPrice2 } from '@/lib/utils/formatPrice';
import { BOUNDS, getTierPriceTypoWarnings, getRisingPriceWarnings, sortTiersByQuantity, type ProductFormValues } from './schema';

interface Props { form: UseFormReturn<ProductFormValues> }

type LimitField = 'listing_quantity' | 'min_order_quantity' | 'max_order_quantity';

const toNullableNumber = (v: unknown): number | null => (v === '' || v == null ? null : Number(v));

export function PricingSection({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'pricing_tiers' });

  const tiers = watch('pricing_tiers') ?? [];
  const unitLabel = (watch('unit_label') ?? '').trim() || 'pcs';
  const listingRaw = watch('listing_quantity') ?? null;
  const minRaw = watch('min_order_quantity') ?? null;
  const maxRaw = watch('max_order_quantity') ?? null;
  const optionGroups = [watch('sizes'), watch('paper_types'), watch('finishes'), watch('sides_options')];
  const multipliers = minOptionMultipliers(optionGroups);
  const hasMultipliers = optionGroups.some((g) => (g ?? []).some((o) => o.price_multiplier !== 1));
  const eff = effectiveLimits({ listing: listingRaw, min: minRaw, max: maxRaw }, tiers);
  const limitsInvalid = Boolean(errors.listing_quantity || errors.min_order_quantity || errors.max_order_quantity)
    || eff.min > eff.max
    || (listingRaw != null && (listingRaw < eff.min || listingRaw > eff.max));
  const sale = saleState(watch('discount_starts_at'), watch('discount_ends_at'));
  const saleNote = saleStateNote(sale);
  const preview = limitsInvalid ? null : listingPreview(tiers, eff.listing, multipliers, sale);
  const notes = limitNotes(tiers, eff, unitLabel);

  const typoWarnings = getTierPriceTypoWarnings(tiers);
  const risingWarnings = getRisingPriceWarnings(tiers, unitLabel);

  function sortRows() {
    const current = form.getValues('pricing_tiers') ?? [];
    const sorted = sortTiersByQuantity(current);
    if (sorted.some((t, i) => t !== current[i])) replace(sorted);
  }
  const hasAnyMrp = tiers.some((t) => t.mrp_per_unit != null);
  const lowestAuto = Math.min(...tiers.map((t) => t.quantity).filter((q) => Number.isFinite(q) && q >= 1), Infinity);
  const autoMin = Number.isFinite(lowestAuto) ? lowestAuto : 1;

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

  function resetLimit(name: LimitField) {
    setValue(name, null, { shouldDirty: true, shouldValidate: true });
  }

  const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] tabular-nums';
  const errorCls = 'mt-1 text-[11px] text-[var(--danger)]';
  const noteCls = 'text-[11px] text-[var(--warning)]';
  const thCls = 'text-left py-2 pr-3 text-[var(--text-muted)] font-medium';

  function limitField(name: LimitField, id: string, label: string, placeholder: string, value: number | null) {
    const err = errors[name]?.message;
    return (
      <div data-field={name} className="min-w-[8.5rem]">
        <div className="mb-1 flex items-center gap-1.5">
          <label htmlFor={id} className="text-xs font-medium text-[var(--text-primary)]">{label}</label>
          {value == null ? (
            <span data-testid={`${name}-auto`} className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">Auto</span>
          ) : (
            <button type="button" onClick={() => resetLimit(name)} className="text-[10px] text-[var(--text-muted)] underline hover:text-[var(--text-primary)]">
              Reset to auto
            </button>
          )}
        </div>
        <input
          id={id}
          {...register(name, { setValueAs: toNullableNumber })}
          type="number"
          min={1}
          max={BOUNDS.QTY_MAX}
          step={1}
          inputMode="numeric"
          placeholder={placeholder}
          className={`${inputCls} w-40`}
        />
        {err && <p className={errorCls}>{err}</p>}
      </div>
    );
  }

  return (
    <div data-field="pricing_tiers">
      <div id="order-quantity" data-field="order-quantity" className="mb-4 rounded-lg border border-[var(--border)] p-3">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          {limitField('listing_quantity', 'listing-quantity-input', 'Show on listing as', `${eff.min} (auto: lowest quantity)`, listingRaw)}
          <div data-field="unit_label" className="min-w-[8.5rem]">
            <label htmlFor="unit-name-input" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">Unit name</label>
            <input
              id="unit-name-input"
              {...register('unit_label')}
              list="unit-label-suggestions"
              maxLength={30}
              placeholder="pcs"
              className={`${inputCls} w-32`}
            />
            <datalist id="unit-label-suggestions">
              {UNIT_LABEL_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
            </datalist>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">Shown after quantities, e.g. 40 pcs</p>
            {errors.unit_label?.message && <p className={errorCls}>{errors.unit_label.message}</p>}
          </div>
          {limitField('min_order_quantity', 'min-order-input', 'Min order', `${autoMin} (auto)`, minRaw)}
          {limitField('max_order_quantity', 'max-order-input', 'Max order', 'No limit', maxRaw)}
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Customers can order any quantity between the minimum and the maximum. The price follows the &lsquo;Quantity from&rsquo; tiers below.
        </p>

        <div data-testid="listing-preview" className="mt-3 space-y-1 rounded-md bg-[var(--surface-hover)] p-2.5 text-xs text-[var(--text-secondary)]">
          {limitsInvalid && (
            <p data-testid="preview-blocked" role="status" className="text-[var(--text-muted)]">Fix the order quantity to see the preview</p>
          )}
          <p data-testid="preview-card" className={limitsInvalid ? 'hidden' : undefined}>
            <span className="text-[var(--text-muted)]">Product card: </span>
            {preview ? (
              <>
                {saleNote && preview.mrpTotalPaise == null && tiers.some((t) => t.mrp_per_unit != null) && (
                  <span data-testid="preview-sale-note" className="mr-1.5 text-[var(--warning)]">{saleNote}: </span>
                )}
                {preview.mrpTotalPaise != null && (
                  <s className="mr-1.5 text-[var(--text-muted)]">{formatPrice2(preview.mrpTotalPaise / 100)}</s>
                )}
                <strong className="text-[var(--text-primary)]">{cardPreviewText(preview, unitLabel)}</strong>
                {preview.percentOff != null && <span className="ml-1.5 text-emerald-600">{preview.percentOff}% off</span>}
              </>
            ) : '—'}
          </p>
          <p data-testid="preview-page" className={limitsInvalid ? 'hidden' : undefined}>
            <span className="text-[var(--text-muted)]">Product page: </span>
            {preview ? pagePreviewText(preview, unitLabel, eff) : '—'}
          </p>
          {hasMultipliers && (
            <p data-testid="preview-options"><span className="text-[var(--text-muted)]">Price from options: </span>shown for the cheapest options</p>
          )}
        </div>

        {(notes.belowLowestTier || notes.unreachableTiers.length > 0 || notes.mixedMrp) && (
          <div role="status" data-testid="limit-notes" className="mt-2 space-y-0.5">
            {notes.belowLowestTier && <p className={noteCls}>{notes.belowLowestTier}</p>}
            {notes.unreachableTiers.map((m) => <p key={m} className={noteCls}>{m}</p>)}
            {notes.mixedMrp && <p className={noteCls}>Add an MRP to every tier so the card discount matches the product page.</p>}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className={thCls}>Quantity from</th>
              <th className={thCls}>Price per piece (₹)</th>
              <th className={thCls}>MRP per piece (₹, optional)</th>
              <th className={thCls}>Discount</th>
              <th className={thCls}>Example</th>
              <th className={thCls}>Best value</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {fields.map((field, i) => {
              const price = tiers[i]?.price_per_unit ?? 0;
              const example = exampleText(tiers[i]?.quantity ?? NaN, price, tiers[i]?.mrp_per_unit, unitLabel);
              return (
                <tr key={field.id}>
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
                    {risingWarnings.filter((w) => w.index === i).map((w) => (
                      <p key={w.message} role="status" data-testid="tier-rising-warning" className="mt-1 max-w-[14rem] text-[11px] text-[var(--warning)]">{w.message}</p>
                    ))}
                    {typoWarnings.filter((w) => w.index === i).map((w) => (
                      <p key={w.index} role="status" data-testid="tier-typo-warning" className="mt-1 max-w-[11rem] text-[11px] text-[var(--warning)]">{w.message}</p>
                    ))}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <input
                      {...register(`pricing_tiers.${i}.mrp_per_unit`, { setValueAs: toNullableNumber })}
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
                  <td className="py-2 pr-3 align-top">
                    <span data-testid="tier-example" className="block py-1.5 text-[var(--text-secondary)] tabular-nums whitespace-nowrap">
                      {example ?? '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-3 align-top">
                    <button
                      type="button"
                      onClick={() => {
                        fields.forEach((_, j) => setValue(`pricing_tiers.${j}.is_best_value`, j === i));
                      }}
                      className={`mt-1.5 ${tiers[i]?.is_best_value ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-400'}`}
                      title="Mark as best value"
                      aria-label={`Mark pricing tier ${i + 1} as best value`}
                    >
                      <Star className={`h-4 w-4 ${tiers[i]?.is_best_value ? 'fill-yellow-500' : ''}`} />
                    </button>
                  </td>
                  <td className="py-2 align-top">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="mt-1.5 text-[var(--text-muted)] hover:text-[var(--danger)]"
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
        Price per piece is the selling price. Customers pay the rate of the highest &lsquo;Quantity from&rsquo; they reach. Blanking an MRP removes the discount but keeps the sale price; use
        &lsquo;Restore price to MRP&rsquo; to put the list price back and clear the sale window.
      </p>
    </div>
  );
}
