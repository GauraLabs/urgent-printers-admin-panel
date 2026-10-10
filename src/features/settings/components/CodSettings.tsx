'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/Spinner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { parseCodAmounts } from '@/lib/api/codSettings';
import { describeApiError } from '@/lib/api/validationErrors';
import { useCodSettings, useUpdateCodSettings } from '../hooks/useCodSettings';
import { SettingsSection, FieldRow, fieldCls } from './SettingsForm';

function toText(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n);
}

export function CodSettings() {
  const { canViewSettings, canManageSettings } = usePermissions();
  const query = useCodSettings(canViewSettings);
  const mutation = useUpdateCodSettings();

  const [enabled, setEnabled] = useState(true);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const data = query.data;
  const [syncedFrom, setSyncedFrom] = useState<typeof data>(undefined);
  if (data && data !== syncedFrom) {
    setSyncedFrom(data);
    setEnabled(data.is_enabled);
    setMin(toText(data.min_order_amount));
    setMax(toText(data.max_order_amount));
    setServerError(null);
    setTouched(false);
  }

  const forbidden = (query.error as { status?: number } | null)?.status === 403;

  if (!canViewSettings || forbidden) {
    return (
      <SettingsSection title="Cash on Delivery" description="COD availability and order amount limits.">
        <p role="alert" className="text-[13px] text-muted-foreground">
          You do not have permission to view COD settings.
        </p>
      </SettingsSection>
    );
  }
  if (query.isLoading) return <LoadingSkeleton rows={3} className="max-w-2xl" />;
  if (query.isError || !data) {
    return (
      <SettingsSection title="Cash on Delivery" description="COD availability and order amount limits.">
        <p role="alert" className="text-[13px] text-[var(--danger)]">Failed to load COD settings.</p>
      </SettingsSection>
    );
  }

  const parsed = parseCodAmounts({ min, max });
  const hasClientError = enabled && Boolean(parsed.minError || parsed.maxError);
  const amountsInvalid = Boolean(parsed.minError || parsed.maxError);
  const isDirty = enabled !== data.is_enabled || min !== toText(data.min_order_amount) || max !== toText(data.max_order_amount);
  const saved = data;
  const readOnly = !canManageSettings;

  function edit(fn: () => void) {
    fn();
    setServerError(null);
    setTouched(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || hasClientError) return;
    setServerError(null);
    try {
      const keepSaved = !enabled && amountsInvalid;
      await mutation.mutateAsync({
        is_enabled: enabled,
        min_order_amount: keepSaved ? saved.min_order_amount : parsed.min,
        max_order_amount: keepSaved ? saved.max_order_amount : parsed.max,
      });
      toast.success('COD settings saved');
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        toast.error('You do not have permission to change COD settings');
      } else {
        const message = describeApiError(err, 'Failed to save COD settings');
        if (status === 422) setServerError(message);
        toast.error(message);
      }
    }
  }

  const showErrors = touched || Boolean(serverError);

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4 max-w-2xl" aria-label="Cash on Delivery settings">
      <SettingsSection title="Cash on Delivery" description="COD availability and order amount limits.">
        {readOnly && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <p>You have view-only access. The &ldquo;Manage Settings&rdquo; permission is required to change COD settings.</p>
          </div>
        )}
        <FieldRow label="Enable COD">
          <Switch
            aria-label="Enable COD"
            checked={enabled}
            onCheckedChange={(v) => edit(() => setEnabled(v))}
            disabled={readOnly || mutation.isPending}
            size="sm"
          />
        </FieldRow>
        {enabled && (
          <>
            <FieldRow label="Minimum order amount (₹)">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">₹</span>
                <input
                  aria-label="Minimum order amount (₹)"
                  type="number" inputMode="decimal" min={0} step="any"
                  value={min}
                  onChange={(e) => edit(() => setMin(e.target.value))}
                  disabled={readOnly || mutation.isPending}
                  placeholder="No limit"
                  className={`${fieldCls} w-40`}
                />
              </div>
              {showErrors && parsed.minError && <p role="alert" className="mt-1 text-xs text-[var(--danger)]">{parsed.minError}</p>}
            </FieldRow>
            <FieldRow label="Maximum order amount (₹)">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">₹</span>
                <input
                  aria-label="Maximum order amount (₹)"
                  type="number" inputMode="decimal" min={0} step="any"
                  value={max}
                  onChange={(e) => edit(() => setMax(e.target.value))}
                  disabled={readOnly || mutation.isPending}
                  placeholder="No limit"
                  className={`${fieldCls} w-40`}
                />
              </div>
              {showErrors && parsed.maxError && <p role="alert" className="mt-1 text-xs text-[var(--danger)]">{parsed.maxError}</p>}
            </FieldRow>
            <p className="text-[11px] text-muted-foreground">
              COD is offered only when the final payable amount (after coupons, including shipping) is within this range. Leave a field blank for no limit.
            </p>
          </>
        )}
        {serverError && <p role="alert" data-testid="cod-server-error" className="text-xs text-[var(--danger)]">{serverError}</p>}
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!isDirty || hasClientError || mutation.isPending}>
              {mutation.isPending ? <><Spinner size="sm" className="mr-2" />Saving…</> : 'Save COD settings'}
            </Button>
          </div>
        )}
      </SettingsSection>
    </form>
  );
}
