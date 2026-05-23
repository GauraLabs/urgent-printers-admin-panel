'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerProfile } from './CustomerProfile';
import { CustomerOrders } from './CustomerOrders';
import { CustomerAddresses } from './CustomerAddresses';
import { CustomerActivity } from './CustomerActivity';
import { CustomerActions } from './CustomerActions';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { useCustomerDetail } from '../../hooks/useCustomers';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  banned: 'bg-[var(--danger)]',
  inactive: 'bg-[var(--text-muted)]',
};

export function CustomerDetailClient({ id }: { id: string }) {
  const { data: customer, isLoading, isError } = useCustomerDetail(id);

  if (isLoading) return <PageSkeleton />;
  if (isError || !customer) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--text-secondary)]">Customer not found.</p>
        <Link href={ROUTES.CUSTOMERS} className="mt-3 inline-block text-sm text-[var(--primary)] hover:underline">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.email ?? customer.phone ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[customer.status] ?? 'bg-gray-400')} />
            <span className="text-xs capitalize text-[var(--text-secondary)]">{customer.status}</span>
            <Link
              href={ROUTES.CUSTOMERS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Customers
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Tabs — 3 cols */}
        <div className="xl:col-span-3">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">
                Orders
                {customer.total_orders > 0 && (
                  <span className="text-[10px] bg-foreground/10 text-foreground rounded-full px-1.5 py-0.5 leading-none font-semibold">
                    {customer.total_orders}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="addresses">
                Addresses
                {customer.addresses.length > 0 && (
                  <span className="text-[10px] bg-foreground/10 text-foreground rounded-full px-1.5 py-0.5 leading-none font-semibold">
                    {customer.addresses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <CustomerProfile customer={customer} />
            </TabsContent>

            <TabsContent value="orders">
              <CustomerOrders customerId={customer.id} />
            </TabsContent>

            <TabsContent value="addresses">
              <CustomerAddresses addresses={customer.addresses} />
            </TabsContent>

            <TabsContent value="activity">
              <CustomerActivity customerId={customer.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar — 1 col */}
        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-20 space-y-4">
            {/* Avatar card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--sidebar-active-bg)] flex items-center justify-center text-xl font-bold text-[var(--sidebar-active-text)] mx-auto mb-3">
                {initials}
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{customer.email ?? customer.phone ?? '—'}</p>
            </div>
            <CustomerActions customer={customer} />
          </div>
        </div>
      </div>
    </div>
  );
}
