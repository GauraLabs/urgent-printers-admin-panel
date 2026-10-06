'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatIst } from '@/lib/utils/istDate';
import type { PriceMismatch } from '@/lib/api/priceMismatches';
import { useResolvePriceMismatch } from '../hooks/usePriceMismatches';
import { CauseBadge } from './CauseBadge';
import { CAUSE_META, STAGE_LABEL } from './causes';
import { formatMoney, formatSignedMoney, diffClass, diffLabel, formatIstShort, addedAtSourceLabel } from './format';
import { cn } from '@/lib/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';

export const NOTE_MAX = 500;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

function DrawerBody({ item, onClose }: { item: PriceMismatch; onClose: () => void }) {
  const [note, setNote] = useState(item.note ?? '');
  const mutation = useResolvePriceMismatch();
  const { can } = usePermissions();
  const canResolve = can('system.manage');
  const resolved = item.resolved_at !== null;
  const noteChanged = note.trim() !== (item.note ?? '').trim();

  async function submit(nextResolved: boolean) {
    try {
      await mutation.mutateAsync({ id: item.id, resolved: nextResolved, note: noteChanged ? note.trim() : undefined });
      toast.success(nextResolved ? 'Marked as resolved' : 'Mismatch reopened');
      onClose();
    } catch {
      toast.error('Could not update the mismatch. Please try again.');
    }
  }

  const multi = item.stage === 'order_create' && item.product_id === null;
  const optionEntries = Object.entries(item.options);

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 overflow-y-auto">
      <div>
        <CauseBadge cause={item.likely_cause} />
        <p className="mt-1.5 text-[12px] text-muted-foreground">{CAUSE_META[item.likely_cause].help}</p>
      </div>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Pricing</h3>
        <div className="divide-y divide-border">
          <Row label="Unit (client / server)">{formatMoney(item.client_unit)} / {formatMoney(item.server_unit)}</Row>
          <Row label="MRP (client / server)">{formatMoney(item.client_mrp)} / {formatMoney(item.server_mrp)}</Row>
          <Row label="Total (client / server)">{formatMoney(item.client_total)} / {formatMoney(item.server_total)}</Row>
          <Row label="Difference">
            <span className={cn('font-medium', diffClass(item.diff_total))}>
              {formatSignedMoney(item.diff_total)}
              {diffLabel(item.diff_total) && <span className="block text-[12px] font-normal">{diffLabel(item.diff_total)}</span>}
            </span>
          </Row>
          <Row label="Quantity">{item.quantity ?? (multi ? 'Multiple items' : '—')}</Row>
          <Row label="Stage">{STAGE_LABEL[item.stage]}</Row>
        </div>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Options</h3>
        {optionEntries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">{multi ? 'Multiple items' : '—'}</p>
        ) : (
          <div className="divide-y divide-border">
            {optionEntries.map(([k, v]) => <Row key={k} label={k}><code className="font-mono text-[12px]">{v === null || v === undefined ? '—' : String(v)}</code></Row>)}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Context</h3>
        <div className="divide-y divide-border">
          <Row label="Recorded">{formatIst(item.created_at)}</Row>
          <Row label="Added at">
            {item.context.added_at
              ? `${formatIstShort(item.context.added_at)} (${addedAtSourceLabel(item.context.added_at_source)})`
              : `— (${addedAtSourceLabel(item.context.added_at_source)})`}
          </Row>
          <Row label="User">{item.user_id ?? 'Guest'}</Row>
          <Row label="Request ID"><code className="font-mono text-[12px]">{item.context.request_id ?? '—'}</code></Row>
          <Row label="User agent"><span className="text-[12px]">{item.context.user_agent ?? '—'}</span></Row>
        </div>
      </section>

      {resolved && (
        <p className="text-[12px] text-muted-foreground">
          Resolved {formatIst(item.resolved_at)}{item.resolved_by ? ` by ${item.resolved_by.name}` : ''}.
        </p>
      )}

      {!canResolve && item.note && (
        <section>
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Note</h3>
          <p className="text-[13px] whitespace-pre-wrap break-words">{item.note}</p>
        </section>
      )}

      {canResolve && (
      <section className="space-y-2">
        <label htmlFor="mismatch-note" className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Note (optional)
        </label>
        <Textarea
          id="mismatch-note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was the cause?"
        />
        <p className="text-[11px] text-muted-foreground text-right">{note.length}/{NOTE_MAX}</p>
        {resolved ? (
          <Button variant="outline" disabled={mutation.isPending} onClick={() => submit(false)}>Unresolve</Button>
        ) : (
          <Button disabled={mutation.isPending} onClick={() => submit(true)}>Mark resolved</Button>
        )}
      </section>
      )}
    </div>
  );
}

interface PriceMismatchDrawerProps {
  item: PriceMismatch | null;
  onClose: () => void;
}

export function PriceMismatchDrawer({ item, onClose }: PriceMismatchDrawerProps) {
  return (
    <Sheet open={item !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {item && (
          <>
            <SheetHeader>
              <SheetTitle>Price mismatch #{item.id}</SheetTitle>
              <SheetDescription>{item.product_slug ?? (item.stage === 'order_create' && item.product_id === null ? 'Multiple items' : 'Unknown product')}</SheetDescription>
            </SheetHeader>
            <DrawerBody key={item.id} item={item} onClose={onClose} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
