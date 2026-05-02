import Link from 'next/link';
import { ShoppingCart, LogIn, UserCog, Star, MapPin, XCircle } from 'lucide-react';
import { useCustomerActivity } from '../../hooks/useCustomers';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDateTime } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import type { CustomerActivity } from '@/types';

const ACTIVITY_ICONS: Record<CustomerActivity['type'], React.ElementType> = {
  order_placed: ShoppingCart,
  order_cancelled: XCircle,
  review_posted: Star,
  login: LogIn,
  profile_updated: UserCog,
  address_added: MapPin,
};

const ACTIVITY_COLORS: Record<CustomerActivity['type'], string> = {
  order_placed: 'text-blue-600 bg-blue-50',
  order_cancelled: 'text-red-600 bg-red-50',
  review_posted: 'text-yellow-600 bg-yellow-50',
  login: 'text-[var(--text-muted)] bg-[var(--surface-secondary)]',
  profile_updated: 'text-purple-600 bg-purple-50',
  address_added: 'text-green-600 bg-green-50',
};

export function CustomerActivity({ customerId }: { customerId: string }) {
  const { data: activities, isLoading } = useCustomerActivity(customerId);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!activities?.length) {
    return <p className="text-sm text-[var(--text-muted)] py-6 text-center">No activity recorded.</p>;
  }

  return (
    <ol className="relative border-l border-[var(--border)] ml-4 space-y-4">
      {activities.map((act) => {
        const Icon = ACTIVITY_ICONS[act.type] ?? ShoppingCart;
        const colorCls = ACTIVITY_COLORS[act.type] ?? 'text-[var(--text-muted)] bg-[var(--surface-secondary)]';
        return (
          <li key={act.id} className="ml-5">
            <span className={`absolute -left-[18px] flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-[var(--background)] ${colorCls}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="pt-1">
              <p className="text-xs font-medium text-[var(--text-primary)]">{act.description}</p>
              {act.entity_id && act.type === 'order_placed' && (
                <Link href={ROUTES.ORDER_DETAIL(act.entity_id)} className="text-[11px] text-[var(--primary)] hover:underline">
                  {act.entity_label}
                </Link>
              )}
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDateTime(act.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
