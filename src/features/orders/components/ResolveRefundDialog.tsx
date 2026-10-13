'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useResolveRefund } from '../hooks/useOrders';
import { describeRefundError } from '@/lib/api/validationErrors';
import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';

type Mode = 'attach' | 'clear' | 'reconcile';

interface ResolveRefundDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  maxAmount: number;
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export function ResolveRefundDialog({ open, onOpenChange, orderId, orderNumber, maxAmount }: ResolveRefundDialogProps) {
  const mutation = useResolveRefund();
  const [mode, setMode] = useState<Mode>('reconcile');
  const [refundId, setRefundId] = useState('');
  const [amount, setAmount] = useState(String(maxAmount));
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(v: boolean) {
    if (!v) {
      setMode('reconcile');
      setRefundId('');
      setAmount(String(maxAmount));
      setError(null);
    }
    onOpenChange(v);
  }

  async function submit() {
    setError(null);
    const amountNum = Number(amount);
    if (mode === 'attach') {
      if (!refundId.trim()) return setError('Enter the Razorpay refund ID.');
      if (!(amountNum > 0) || amountNum > maxAmount) {
        return setError(`Amount must be between 0.01 and ${formatPrice(maxAmount)}.`);
      }
    }
    try {
      if (mode === 'attach') {
        await mutation.mutateAsync({ order_id: orderId, mode: 'attach', refund_id: refundId.trim(), amount: amountNum });
        toast.success(`Refund ${refundId.trim()} recorded for ${orderNumber}`);
      } else if (mode === 'reconcile') {
        const result = await mutation.mutateAsync({ order_id: orderId, mode: 'reconcile' });
        toast.success(`Refund ${result.refund_id ?? ''} adopted from Razorpay for ${orderNumber}`.replace('  ', ' '));
      } else {
        await mutation.mutateAsync({ order_id: orderId, mode: 'clear' });
        toast.success(`Refund lock cleared for ${orderNumber}`);
      }
      handleOpenChange(false);
    } catch (err: unknown) {
      setError(describeRefundError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve refund</DialogTitle>
          <DialogDescription>
            Razorpay did not confirm the refund for {orderNumber}. Check the Razorpay dashboard first, then record what actually happened.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Resolution">
            {([
              ['reconcile', 'Adopt whatever Razorpay holds'],
              ['attach', 'Enter the refund from the Razorpay dashboard'],
              ['clear', 'No refund was made'],
            ] as [Mode, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  'px-3 py-2 text-xs rounded-lg border text-left cursor-pointer',
                  mode === value
                    ? 'border-[var(--primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'attach' ? (
            <>
              <div>
                <label htmlFor="resolve-refund-id" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Razorpay refund ID</label>
                <input id="resolve-refund-id" value={refundId} onChange={(e) => setRefundId(e.target.value)} placeholder="rfnd_…" className={inputClass} />
              </div>
              <div>
                <label htmlFor="resolve-refund-amount" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Refunded amount (₹)</label>
                <input id="resolve-refund-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </div>
            </>
          ) : mode === 'reconcile' ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Looks up this payment's refunds at Razorpay and records the one it holds. Fails if Razorpay has no refund for this payment.
            </p>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">
              This removes the refund lock so the order can be refunded again. Only do this if you have confirmed in Razorpay that no refund was created, otherwise the customer could be refunded twice.
            </p>
          )}

          {error && <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : mode === 'attach' ? 'Record refund' : mode === 'reconcile' ? 'Reconcile' : 'Clear lock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
