'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { useCreateRefund } from '../hooks/useOrders';
import { formatPrice } from '@/lib/utils/formatPrice';
import { describeRefundError, isRefundUnconfirmed } from '@/lib/api/validationErrors';
import type { RefundReason } from '@/types';

const REASONS: { value: RefundReason; label: string }[] = [
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'damaged', label: 'Damaged in Transit' },
  { value: 'other', label: 'Other' },
];

const NOTES_MAX = 500;

function makeSchema(maxAmount: number) {
  return z.object({
    amount: z
      .number({ error: 'Enter an amount' })
      .positive('Amount must be greater than 0')
      .max(maxAmount, `Amount can't exceed ${formatPrice(maxAmount)}`),
    reason: z.string().min(1, 'Select a reason'),
    notes: z.string().max(NOTES_MAX, `Notes can be at most ${NOTES_MAX} characters`).optional(),
  });
}
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  maxAmount: number;
  onResolveRequested?: () => void;
}

export function RefundDialog({ open, onOpenChange, orderId, orderNumber, maxAmount, onResolveRequested }: RefundDialogProps) {
  const mutation = useCreateRefund();
  const uid = useId();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(makeSchema(maxAmount)),
    defaultValues: { amount: maxAmount, reason: '', notes: '' },
  });

  const reason = watch('reason');

  function handleOpenChange(v: boolean) {
    reset();
    setErrorMessage(null);
    setUnconfirmed(false);
    onOpenChange(v);
  }

  async function onSubmit(values: FormValues) {
    setErrorMessage(null);
    setUnconfirmed(false);
    try {
      const result = await mutation.mutateAsync({
        order_id: orderId,
        amount: values.amount === maxAmount ? undefined : values.amount,
        reason: values.reason as RefundReason,
        notes: values.notes?.trim() || undefined,
      });
      toast.success(`Refund of ${formatPrice(result.refund_amount)} issued for ${orderNumber}`, {
        description: `Refund ID: ${result.refund_id}`,
      });
      handleOpenChange(false);
    } catch (err: unknown) {
      setErrorMessage(describeRefundError(err));
      setUnconfirmed(isRefundUnconfirmed(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--danger-bg)] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
            </div>
            <DialogTitle>Issue Refund</DialogTitle>
          </div>
          <DialogDescription>
            Refund for {orderNumber}. Maximum refundable: {formatPrice(maxAmount)}. This issues a real refund through Razorpay.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div role="alert" className="p-3 text-xs rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]">
            <p>{errorMessage}</p>
            {unconfirmed && (
              <>
                <p className="mt-1">This order is locked against further refunds until a super admin resolves it.</p>
                {onResolveRequested && (
                  <button
                    type="button"
                    onClick={() => { handleOpenChange(false); onResolveRequested(); }}
                    className="mt-2 underline font-medium cursor-pointer"
                  >
                    Resolve refund
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
          <div>
            <label htmlFor={`${uid}-amount`} className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Amount (₹)</label>
            <input
              id={`${uid}-amount`}
              type="number"
              step="0.01"
              max={maxAmount}
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.amount && <p className="mt-1 text-xs text-[var(--danger)]">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Reason</label>
            <Select value={reason} onValueChange={(v) => setValue('reason', v ?? '', { shouldValidate: true })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.reason && <p className="mt-1 text-xs text-[var(--danger)]">{errors.reason.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Notes <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              maxLength={NOTES_MAX}
              placeholder="Additional notes for this refund…"
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || unconfirmed}
              className="bg-[var(--danger)] hover:bg-red-600 text-white"
            >
              {mutation.isPending ? 'Processing…' : 'Issue Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
