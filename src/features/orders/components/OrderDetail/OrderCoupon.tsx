import { Ticket } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { CouponSnapshot } from '@/types';

interface Props {
  code: string;
  discountAmount: number;
  snapshot: CouponSnapshot | null;
  appliedTo: { eligible: number; total: number } | null;
}

/** Summary parts built from the order-time snapshot; empty for legacy orders (null snapshot). */
export function couponSummaryParts(snapshot: CouponSnapshot | null, appliedTo: Props['appliedTo']): string[] {
  if (!snapshot) return [];
  const parts: string[] = [];
  if (snapshot.type && snapshot.value != null) {
    const off = snapshot.type === 'percentage' ? `${snapshot.value}% off` : `${formatPrice(snapshot.value)} off`;
    parts.push(snapshot.max_discount != null ? `${off} (max ${formatPrice(snapshot.max_discount)})` : off);
  }
  if (appliedTo) parts.push(`Applied to ${appliedTo.eligible} of ${appliedTo.total} ${appliedTo.total === 1 ? 'item' : 'items'}`);
  if (!snapshot.all_items) {
    const names = [...snapshot.product_names, ...snapshot.category_names];
    const count = snapshot.product_ids.length + snapshot.category_ids.length;
    parts.push(`Scope: ${names.length > 0 ? names.join(', ') : `${count} selected ${count === 1 ? 'product/category' : 'products/categories'}`}`);
  }
  if (!snapshot.applies_to_discounted_items) parts.push('Excludes discounted items');
  if (snapshot.minimum_order_amount != null && snapshot.minimum_order_amount > 0) {
    parts.push(`Min. order ${formatPrice(snapshot.minimum_order_amount)}`);
  }
  return parts;
}

export function OrderCoupon({ code, discountAmount, snapshot, appliedTo }: Props) {
  const parts = couponSummaryParts(snapshot, appliedTo);
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Coupon Applied</h3>
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-[var(--primary)]" />
        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{code}</span>
      </div>
      {parts.length > 0 && (
        <p data-testid="coupon-summary" className="mt-1 text-xs text-[var(--text-secondary)]">{parts.join(' · ')}</p>
      )}
      {discountAmount > 0 && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Saved {formatPrice(discountAmount)}</p>
      )}
    </div>
  );
}
