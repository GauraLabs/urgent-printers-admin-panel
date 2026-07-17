import { useState } from 'react';
import { MapPin, Truck, ExternalLink, PackagePlus } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { usePermissions } from '@/hooks/usePermissions';
import { ManualShipmentDialog } from '@/features/shipping/components/ManualShipmentDialog';
import { Badge } from '@/components/common/StatusBadge';
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_VARIANT } from '@/lib/constants/shipmentStatus';
import type { OrderAddress, OrderShippingInfo, OrderStatus } from '@/types';

interface Props {
  address: OrderAddress;
  shipping: OrderShippingInfo;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
}

export function OrderShipping({ address, shipping, orderId, orderNumber, orderStatus }: Props) {
  const [manualOpen, setManualOpen] = useState(false);
  const { canManageShipping } = usePermissions();
  const canDispatchManually = canManageShipping && !shipping.courier && orderStatus === 'ready_to_dispatch';

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Shipping</h3>
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" /> Delivery Address
          </p>
          <address className="not-italic text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-medium text-[var(--text-primary)]">{address.full_name}</span><br />
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
            {address.city}, {address.state} {address.pincode}<br />
            {address.phone && (
              <a href={`tel:${address.phone}`} className="text-[var(--primary)] hover:underline">{address.phone}</a>
            )}
          </address>
        </div>

        {shipping.courier && (
          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
              <Truck className="h-3 w-3" /> Shipment
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Courier</span>
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-[var(--text-primary)]">{shipping.courier}</span>
                {shipping.shipment_source === 'manual' && (
                  <Badge label="Manual" variant="warning" dot={false} />
                )}
              </span>
            </div>
            {shipping.shipment_status && (
              <div className="flex justify-between text-xs items-center">
                <span className="text-[var(--text-muted)]">Status</span>
                <Badge
                  label={SHIPMENT_STATUS_LABEL[shipping.shipment_status]}
                  variant={SHIPMENT_STATUS_VARIANT[shipping.shipment_status]}
                  dot
                />
              </div>
            )}
            {shipping.tracking_number && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Tracking</span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">{shipping.tracking_number}</span>
              </div>
            )}
            {shipping.estimated_delivery && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Est. Delivery</span>
                <span className="text-[var(--text-secondary)]">{formatDate(shipping.estimated_delivery)}</span>
              </div>
            )}
            {shipping.tracking_url ? (
              <a href={shipping.tracking_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline mt-1">
                Track shipment <ExternalLink className="h-3 w-3" />
              </a>
            ) : shipping.shipment_source === 'manual' && (
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Manually entered — no live tracking available.
              </p>
            )}
          </div>
        )}

        {canDispatchManually && (
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:underline cursor-pointer"
            >
              <PackagePlus className="h-3.5 w-3.5" /> Enter shipment manually
            </button>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Use this if Shiprocket is down or doesn&apos;t serve this pincode.
            </p>
          </div>
        )}
      </div>

      <ManualShipmentDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        orderId={orderId}
        orderNumber={orderNumber}
      />
    </div>
  );
}
