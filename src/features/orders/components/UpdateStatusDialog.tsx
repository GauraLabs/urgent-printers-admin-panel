'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useUpdateOrderStatus } from '../hooks/useOrders';
import { describeStatusChangeError } from '@/lib/api/validationErrors';
import { ORDER_STATUS_LABELS } from '@/lib/constants/orderStatuses';
import type { OrderStatus } from '@/types';

// Mirrors ALLOWED_TRANSITIONS in urgent-printers-backend/app/services/order_transitions.py.
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['artwork_pending', 'artwork_approved', 'printing', 'cancelled'],
  artwork_pending: ['artwork_approved', 'confirmed', 'cancelled'],
  artwork_approved: ['printing', 'cancelled'],
  printing: ['ready_to_dispatch', 'shipped', 'cancelled'],
  ready_to_dispatch: ['shipped', 'cancelled'],
  shipped: ['delivered', 'refund_initiated', 'cancelled'],
  delivered: ['refund_initiated'],
  cancelled: ['refund_initiated'],
  refund_initiated: ['refunded'],
  refunded: [],
};

const schema = z.object({
  status: z.string().min(1, 'Select a status'),
  note: z.string().max(500, 'Note can be at most 500 characters').optional(),
  tracking_number: z.string().max(255, 'Tracking number can be at most 255 characters').optional(),
});
type FormValues = z.infer<typeof schema>;

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  initialStatus?: OrderStatus;
  requireTrackingForShipped?: boolean;
}

export function UpdateStatusDialog({
  open, onOpenChange, orderId, orderNumber, currentStatus, initialStatus, requireTrackingForShipped = false,
}: UpdateStatusDialogProps) {
  const mutation = useUpdateOrderStatus();
  const nextStatuses = VALID_TRANSITIONS[currentStatus] ?? [];

  const { register, handleSubmit, setValue, setError, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: initialStatus ?? '', note: '', tracking_number: '' },
  });

  const selectedStatus = watch('status');
  const isShipping = selectedStatus === 'shipped';

  async function onSubmit(values: FormValues) {
    const tracking = values.tracking_number?.trim();
    if (values.status === 'shipped' && requireTrackingForShipped && !tracking) {
      setError('tracking_number', { message: 'Enter the tracking number' });
      return;
    }
    try {
      await mutation.mutateAsync({
        id: orderId,
        status: values.status as OrderStatus,
        trackingNumber: values.status === 'shipped' ? tracking || undefined : undefined,
        note: values.note,
      });
      toast.success(`${orderNumber} moved to ${ORDER_STATUS_LABELS[values.status as OrderStatus]}`);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(describeStatusChangeError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1.5">
              Current: <span className="font-medium text-[var(--text-primary)]">{ORDER_STATUS_LABELS[currentStatus]}</span>
            </p>
            <Select value={selectedStatus} onValueChange={(v) => setValue('status', v ?? '', { shouldValidate: true })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.length === 0 ? (
                  <SelectItem value="" disabled>No transitions available</SelectItem>
                ) : (
                  nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.status && <p className="mt-1 text-xs text-[var(--danger)]">{errors.status.message}</p>}
          </div>

          {isShipping && (
            <div>
              <label htmlFor="status-tracking-number" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                Tracking number{' '}
                {!requireTrackingForShipped && <span className="text-[var(--text-muted)] font-normal">(optional)</span>}
              </label>
              <input
                id="status-tracking-number"
                {...register('tracking_number')}
                maxLength={255}
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              {errors.tracking_number && <p className="mt-1 text-xs text-[var(--danger)]">{errors.tracking_number.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Note <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              {...register('note')}
              rows={2}
              maxLength={500}
              placeholder="Add an internal note about this status change…"
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedStatus}>
              {mutation.isPending ? 'Updating…' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
