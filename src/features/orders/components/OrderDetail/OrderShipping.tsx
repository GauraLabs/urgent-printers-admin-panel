import { MapPin, Truck, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import type { OrderAddress, OrderShippingInfo } from '@/types';

interface Props {
  address: OrderAddress;
  shipping: OrderShippingInfo;
}

export function OrderShipping({ address, shipping }: Props) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Shipping</h3>
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" /> Delivery Address
          </p>
          <address className="not-italic text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-medium text-[var(--text-primary)]">{address.name}</span><br />
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
            {address.city}, {address.state} {address.pincode}<br />
            <a href={`tel:${address.phone}`} className="text-[var(--primary)] hover:underline">{address.phone}</a>
          </address>
        </div>

        {shipping.courier && (
          <div className="border-t border-[var(--border-subtle)] pt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
              <Truck className="h-3 w-3" /> Shipment
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Courier</span>
              <span className="font-medium text-[var(--text-primary)]">{shipping.courier}</span>
            </div>
            {shipping.awb_number && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">AWB</span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">{shipping.awb_number}</span>
              </div>
            )}
            {shipping.estimated_delivery && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Est. Delivery</span>
                <span className="text-[var(--text-secondary)]">{formatDate(shipping.estimated_delivery)}</span>
              </div>
            )}
            {shipping.tracking_url && (
              <a href={shipping.tracking_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline mt-1">
                Track shipment <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
