import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { CouponsTable } from '@/features/coupons/components/CouponsTable';

export const metadata: Metadata = { title: 'Coupons' };

export default function CouponsPage() {
  return (
    <div>
      <PageHeader title="Coupons" description="Manage discount codes and promotions." />
      <CouponsTable />
    </div>
  );
}
