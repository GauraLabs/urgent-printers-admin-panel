import Link from 'next/link';
import { User, Mail, Phone, ShoppingCart, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ROUTES } from '@/lib/constants/routes';
import type { OrderWithDetails } from '@/types';

type Props = Pick<OrderWithDetails, 'customer_id' | 'customer_name' | 'customer_email' | 'customer_phone' | 'customer_total_orders'>;

export function OrderCustomer({ customer_id, customer_name, customer_email, customer_phone, customer_total_orders }: Props) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Customer</h3>
        <Link href={ROUTES.CUSTOMER_DETAIL(String(customer_id ?? ''))} className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-0.5">
          View profile <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
          <span className="font-medium text-[var(--text-primary)]">{customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Mail className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
          {customer_email}
        </div>
        {customer_phone && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Phone className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
            {customer_phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <ShoppingCart className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
          {customer_total_orders} total orders
        </div>
      </div>
    </div>
  );
}
