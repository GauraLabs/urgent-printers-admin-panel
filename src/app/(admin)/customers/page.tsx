import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomersTable } from '@/features/customers/components/CustomersTable';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" description="View and manage all customer accounts." />
      <CustomersTable />
    </div>
  );
}
