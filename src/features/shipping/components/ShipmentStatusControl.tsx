'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdateShipmentStatus } from '../hooks/useShipping';
import type { ManualShipmentStatusTarget } from '@/lib/api/shipping';
import { SHIPMENT_STATUS_LABEL } from '@/lib/constants/shipmentStatus';
import type { ApiError, ShipmentStatus } from '@/types';

const SELECTABLE_STATUSES: ManualShipmentStatusTarget[] = [
  'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'rto', 'cancelled',
];

const TERMINAL_STATUSES = new Set<ManualShipmentStatusTarget>(['delivered', 'rto', 'cancelled']);

interface ShipmentStatusControlProps {
  orderId: string;
  currentStatus: ShipmentStatus | null;
  size?: 'sm' | 'default';
}

export function ShipmentStatusControl({ orderId, currentStatus, size = 'default' }: ShipmentStatusControlProps) {
  const [pendingStatus, setPendingStatus] = useState<ManualShipmentStatusTarget | null>(null);
  const mutation = useUpdateShipmentStatus();

  async function applyStatus(status: ManualShipmentStatusTarget) {
    try {
      await mutation.mutateAsync({ orderId, status });
      toast.success(`Shipment marked ${SHIPMENT_STATUS_LABEL[status]}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        toast.error(apiErr.message || 'This shipment is Shiprocket-managed and cannot be updated manually.');
      } else {
        toast.error('Failed to update shipment status. Please try again.');
      }
    }
  }

  function handleChange(value: string | null) {
    if (!value || value === currentStatus) return;
    const status = value as ManualShipmentStatusTarget;
    if (TERMINAL_STATUSES.has(status)) {
      setPendingStatus(status);
      return;
    }
    void applyStatus(status);
  }

  const selectValue = currentStatus && SELECTABLE_STATUSES.includes(currentStatus as ManualShipmentStatusTarget)
    ? currentStatus
    : '';

  return (
    <>
      <Select value={selectValue} onValueChange={handleChange} disabled={mutation.isPending}>
        <SelectTrigger size={size}>
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{SHIPMENT_STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={pendingStatus !== null} onOpenChange={(v) => !v && setPendingStatus(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <DialogDescription>
              Mark this shipment as {pendingStatus ? SHIPMENT_STATUS_LABEL[pendingStatus] : ''}?
              {pendingStatus === 'delivered' && ' This will also mark the order itself as delivered.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingStatus(null)}>Cancel</Button>
            <Button
              type="button"
              onClick={async () => {
                if (pendingStatus) await applyStatus(pendingStatus);
                setPendingStatus(null);
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
