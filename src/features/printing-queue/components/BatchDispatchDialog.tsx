'use client';

import { useState, useEffect } from 'react';
import { Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getServiceabilityBulk, type CourierOption } from '@/lib/api/printingQueue';
import { useCreateShipmentsBulk } from '../hooks/usePrintingQueue';
import type { PrintingQueueItem } from '@/lib/api/printingQueue';

interface BatchDispatchDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: PrintingQueueItem[];
  onSuccess: () => void;
}

export function BatchDispatchDialog({ open, onOpenChange, orders, onSuccess }: BatchDispatchDialogProps) {
  const mutation = useCreateShipmentsBulk();
  const [couriers, setCouriers] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<CourierOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orders.length) return;
    setLoading(true);
    getServiceabilityBulk(orders.map((o) => o.order_id))
      .then((res) => {
        if (res[0]) setOptions(res[0].couriers);
        const defaults: Record<string, string> = {};
        orders.forEach((o) => { defaults[o.order_id] = res[0]?.couriers[0]?.name ?? ''; });
        setCouriers(defaults);
      })
      .finally(() => setLoading(false));
  }, [open, orders]);

  async function handleDispatch() {
    try {
      const payload = orders.map((o) => ({
        order_id: o.order_id,
        courier: couriers[o.order_id] ?? options[0]?.name ?? '',
      }));
      const result = await mutation.mutateAsync(payload);
      toast.success(`${result.created} shipment${result.created !== 1 ? 's' : ''} created successfully`);
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create shipments. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--info-bg)] flex items-center justify-center flex-shrink-0">
              <Truck className="h-4 w-4 text-[var(--info)]" />
            </div>
            <DialogTitle>Create Shipments</DialogTitle>
          </div>
          <DialogDescription>
            Creating shipments for {orders.length} order{orders.length !== 1 ? 's' : ''}. Select a courier for each.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking serviceability…
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {orders.map((order) => (
              <div key={order.order_id} className="flex items-center gap-3 p-2.5 bg-[var(--surface-secondary)] rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] font-mono">{order.order_number}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{order.customer_name} · {order.product_name}</p>
                </div>
                <Select
                  value={couriers[order.order_id] ?? ''}
                  onValueChange={(v) => setCouriers((prev) => ({ ...prev, [order.order_id]: v ?? '' }))}
                >
                  <SelectTrigger size="sm" className="w-36 flex-shrink-0">
                    <SelectValue placeholder="Courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name} · ₹{c.rate} · {c.min_days}–{c.max_days}d
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleDispatch} disabled={loading || mutation.isPending || !orders.length}>
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
            ) : (
              <><Truck className="h-4 w-4" /> Create {orders.length} Shipment{orders.length !== 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
