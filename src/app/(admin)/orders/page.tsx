import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrdersTable } from '@/features/orders/components/OrdersTable';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" description="Manage and track all customer orders." />
      <OrdersTable />
    </div>
  );
}
