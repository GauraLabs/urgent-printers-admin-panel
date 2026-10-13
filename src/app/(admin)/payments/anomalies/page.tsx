import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaymentAnomaliesView } from '@/features/payments/components/PaymentAnomaliesView';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Payment Anomalies' };

export default function PaymentAnomaliesPage() {
  return (
    <div>
      <PageHeader
        title="Payment Anomalies"
        description="Payments that need a human: money captured for cancelled orders, amount mismatches, and payments stuck awaiting capture."
        actions={
          <Link href={ROUTES.PAYMENTS} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            ← All Payments
          </Link>
        }
      />
      <PaymentAnomaliesView />
    </div>
  );
}
