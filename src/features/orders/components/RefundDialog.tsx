'use client';

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
import type { RefundReason } from '@/types';

const REASONS: { value: RefundReason; label: string }[] = [
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'damaged', label: 'Damaged in Transit' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  reason: z.string().min(1, 'Select a reason'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  maxAmount: number;
}

export function RefundDialog({ open, onOpenChange, orderId, orderNumber, maxAmount }: RefundDialogProps) {
  const mutation = useCreateRefund();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: maxAmount, reason: '', notes: '' },
  });

  const reason = watch('reason');

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({
        order_id: orderId,
        amount: values.amount,
        reason: values.reason as RefundReason,
        notes: values.notes ?? undefined,
      });
      toast.success(`Refund of ${formatPrice(values.amount)} initiated for ${orderNumber}`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to initiate refund. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--danger-bg)] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
            </div>
            <DialogTitle>Initiate Refund</DialogTitle>
          </div>
          <DialogDescription>
            Refund for {orderNumber}. Maximum refundable: {formatPrice(maxAmount)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Amount (₹)</label>
            <input
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
              placeholder="Additional notes for this refund…"
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[var(--danger)] hover:bg-red-600 text-white"
            >
              {mutation.isPending ? 'Processing…' : 'Initiate Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
