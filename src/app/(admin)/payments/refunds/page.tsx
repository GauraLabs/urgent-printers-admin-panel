import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { RefundsTable } from '@/features/payments/components/RefundsTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Refunds' };

export default function RefundsPage() {
  return (
    <div>
      <PageHeader
        title="Refunds"
        description="All refund transactions."
        actions={
          <Link href={ROUTES.PAYMENTS} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            ← All Payments
          </Link>
        }
      />
      <RefundsTable />
    </div>
  );
}
