'use client';

import { useState, useEffect } from 'react';
import { Truck, Loader2, PackagePlus, CheckCircle2 } from 'lucide-react';
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
import { ManualShipmentDialog } from '@/features/shipping/components/ManualShipmentDialog';
import type { PrintingQueueItem } from '@/lib/api/printingQueue';
import { formatPrice } from '@/lib/utils/formatPrice';

interface BatchDispatchDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: PrintingQueueItem[];
  onSuccess: () => void;
}

interface OrderServiceability {
  couriers: CourierOption[];
  error: string | null;
}

export function BatchDispatchDialog({ open, onOpenChange, orders, onSuccess }: BatchDispatchDialogProps) {
  const mutation = useCreateShipmentsBulk();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [serviceability, setServiceability] = useState<Record<string, OrderServiceability>>({});
  const [loading, setLoading] = useState(false);
  const [manualOrder, setManualOrder] = useState<PrintingQueueItem | null>(null);
  const [manuallyDispatched, setManuallyDispatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !orders.length) return;
    setLoading(true);
    setManuallyDispatched(new Set());
    getServiceabilityBulk(orders.map((o) => o.order_id))
      .then((res) => {
        const byOrder: Record<string, OrderServiceability> = {};
        const defaults: Record<string, string> = {};
        res.forEach((r) => {
          byOrder[r.order_id] = { couriers: r.couriers, error: r.error };
          if (r.couriers[0]) defaults[r.order_id] = r.couriers[0].courier_id;
        });
        setServiceability(byOrder);
        setSelected(defaults);
      })
      .finally(() => setLoading(false));
  }, [open, orders]);

  const pendingOrders = orders.filter((o) => !manuallyDispatched.has(o.order_id));

  async function handleDispatch() {
    const payload = pendingOrders
      .filter((o) => selected[o.order_id])
      .map((o) => ({ order_id: o.order_id, courier: selected[o.order_id] }));

    if (!payload.length) {
      toast.error('No orders have a courier selected.');
      return;
    }

    try {
      const results = await mutation.mutateAsync(payload);
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;
      if (failed === 0) {
        toast.success(`${succeeded} shipment${succeeded !== 1 ? 's' : ''} created successfully`);
      } else if (succeeded === 0) {
        toast.error(`Failed to create ${failed} shipment${failed !== 1 ? 's' : ''}`);
      } else {
        toast.warning(`${succeeded} shipment${succeeded !== 1 ? 's' : ''} created, ${failed} failed`);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create shipments. Please try again.');
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v && manuallyDispatched.size > 0) onSuccess();
    onOpenChange(v);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {orders.map((order) => {
              const entry = serviceability[order.order_id];
              const isManual = manuallyDispatched.has(order.order_id);
              return (
                <div key={order.order_id} className="flex items-center gap-3 p-2.5 bg-[var(--surface-secondary)] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] font-mono">{order.order_number}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{order.customer_name} · {order.product_name}</p>
                    {!isManual && entry?.error && (
                      <p className="text-[11px] text-[var(--danger)] mt-0.5">{entry.error}</p>
                    )}
                  </div>
                  {isManual ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--success)] flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched manually
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!entry?.error && (
                        <Select
                          value={selected[order.order_id] ?? ''}
                          onValueChange={(v) => setSelected((prev) => ({ ...prev, [order.order_id]: v ?? '' }))}
                        >
                          <SelectTrigger size="sm" className="w-60">
                            <SelectValue placeholder="Courier" />
                          </SelectTrigger>
                          <SelectContent className="min-w-72">
                            {(entry?.couriers ?? []).map((c) => (
                              <SelectItem key={c.courier_id} value={c.courier_id}>
                                <div className="flex flex-col items-start py-0.5">
                                  <span className="font-medium">{c.name}</span>
                                  <span className="text-[11px] text-[var(--text-muted)]">
                                    {formatPrice(c.rate)} · {c.min_days}–{c.max_days}d
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <button
                        type="button"
                        onClick={() => setManualOrder(order)}
                        className="flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        <PackagePlus className="h-3 w-3" /> Enter manually
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
            {pendingOrders.length === 0 && manuallyDispatched.size > 0 ? 'Close' : 'Cancel'}
          </Button>
          {pendingOrders.length > 0 && (
            <Button onClick={handleDispatch} disabled={loading || mutation.isPending || !pendingOrders.length}>
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><Truck className="h-4 w-4" /> Create {pendingOrders.length} Shipment{pendingOrders.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {manualOrder && (
      <ManualShipmentDialog
        open={!!manualOrder}
        onOpenChange={(v) => { if (!v) setManualOrder(null); }}
        orderId={manualOrder.order_id}
        orderNumber={manualOrder.order_number}
        onSuccess={() => {
          setManuallyDispatched((prev) => new Set(prev).add(manualOrder.order_id));
          setManualOrder(null);
        }}
      />
    )}
    </>
  );
}
