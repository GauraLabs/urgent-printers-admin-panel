import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaymentsTable } from '@/features/payments/components/PaymentsTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Payments' };

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payment transactions."
        actions={
          <Link href={ROUTES.REFUNDS} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            View Refunds →
          </Link>
        }
      />
      <PaymentsTable />
    </div>
  );
}
