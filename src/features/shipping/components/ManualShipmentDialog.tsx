'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PackagePlus } from 'lucide-react';
import { useCreateManualShipment } from '../hooks/useShipping';

const schema = z.object({
  courier: z.string().min(1, 'Courier name is required'),
  tracking_number: z.string().min(1, 'Tracking number is required'),
  tracking_url: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
  estimated_delivery_date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface ManualShipmentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

export function ManualShipmentDialog({ open, onOpenChange, orderId, orderNumber, onSuccess }: ManualShipmentDialogProps) {
  const mutation = useCreateManualShipment();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { courier: '', tracking_number: '', tracking_url: '', estimated_delivery_date: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({
        orderId,
        payload: {
          courier: values.courier,
          tracking_number: values.tracking_number,
          tracking_url: values.tracking_url || null,
          estimated_delivery_date: values.estimated_delivery_date || null,
        },
      });
      toast.success(`Manual shipment recorded for ${orderNumber}`);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to record manual shipment. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--info-bg)] flex items-center justify-center flex-shrink-0">
              <PackagePlus className="h-4 w-4 text-[var(--info)]" />
            </div>
            <DialogTitle>Enter Shipment Manually</DialogTitle>
          </div>
          <DialogDescription>
            For {orderNumber}. Use this when Shiprocket is down or doesn&apos;t serve this pincode — no AWB is assigned, so delivery must be confirmed by hand.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Courier</label>
            <input
              type="text"
              placeholder="e.g. Delhivery, local courier"
              {...register('courier')}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.courier && <p className="mt-1 text-xs text-[var(--danger)]">{errors.courier.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tracking Number</label>
            <input
              type="text"
              {...register('tracking_number')}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.tracking_number && <p className="mt-1 text-xs text-[var(--danger)]">{errors.tracking_number.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Tracking URL <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://…"
              {...register('tracking_url')}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.tracking_url && <p className="mt-1 text-xs text-[var(--danger)]">{errors.tracking_url.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Estimated Delivery Date <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="date"
              {...register('estimated_delivery_date')}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Shipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
