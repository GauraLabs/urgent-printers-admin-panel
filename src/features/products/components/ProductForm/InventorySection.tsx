'use client';

import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Package, AlertTriangle } from 'lucide-react';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const inputCls = 'px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 tabular-nums disabled:opacity-40 w-36';

export function InventorySection({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const tracking = watch('track_inventory') ?? false;
  const stock = watch('stock_quantity') ?? null;
  const threshold = watch('low_stock_threshold') ?? null;
  const isLow = tracking && stock !== null && threshold !== null && stock <= threshold;
  const uid = useId();
  const trackingLabelId = `${uid}-tracking-label`;
  const stockId = `${uid}-stock`;
  const thresholdId = `${uid}-threshold`;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Switch
          checked={tracking}
          onCheckedChange={(v) => {
            setValue('track_inventory', v, { shouldDirty: true });
            if (!v) {
              setValue('stock_quantity', null, { shouldDirty: true });
              setValue('low_stock_threshold', null, { shouldDirty: true });
            }
          }}
          size="sm"
          className="mt-0.5"
          aria-labelledby={trackingLabelId}
        />
        <div>
          <p id={trackingLabelId} className="text-sm font-medium text-foreground">Track inventory for this product</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Turn on if this product uses physical materials or has a limited stock. Leave off for made-to-order items.
          </p>
        </div>
      </label>

      {tracking && (
        <div className="pl-9 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={stockId} className="block text-xs font-medium text-foreground mb-1.5">
                Current Stock (units)
              </label>
              <input
                id={stockId}
                {...register('stock_quantity', { valueAsNumber: true })}
                type="number"
                min={0}
                className={inputCls}
                placeholder="e.g. 500"
              />
              {errors.stock_quantity && <p className="mt-1 text-[11px] text-[var(--danger)]">{errors.stock_quantity.message}</p>}
            </div>
            <div>
              <label htmlFor={thresholdId} className="block text-xs font-medium text-foreground mb-1.5">
                Low Stock Alert at
              </label>
              <input
                id={thresholdId}
                {...register('low_stock_threshold', { valueAsNumber: true })}
                type="number"
                min={0}
                className={inputCls}
                placeholder="e.g. 50"
              />
              {errors.low_stock_threshold ? (
                <p className="mt-1 text-[11px] text-[var(--danger)]">{errors.low_stock_threshold.message}</p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">Triggers a warning when stock falls below this.</p>
              )}
            </div>
          </div>

          {/* Live status */}
          {stock !== null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              isLow
                ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
                : stock === 0
                  ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-400'
            }`}>
              {stock === 0 ? (
                <><AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> Out of stock — product will be hidden on the storefront.</>
              ) : isLow ? (
                <><AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> Low stock — only {stock} units remaining.</>
              ) : (
                <><Package className="h-3.5 w-3.5 flex-shrink-0" /> {stock} units in stock.</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
