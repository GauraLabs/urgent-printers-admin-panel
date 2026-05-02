import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaymentSettings } from '@/features/settings/components/PaymentSettings';

export const metadata: Metadata = { title: 'Payments Settings' };

export default function PaymentSettingsPage() {
  return (
    <div>
      <PageHeader title="Payments Settings" />
      <PaymentSettings />
    </div>
  );
}
