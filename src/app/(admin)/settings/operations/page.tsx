import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { OperationsSettings } from '@/features/settings/components/OperationsSettings';

export const metadata: Metadata = { title: 'Operations Settings' };

export default function OperationsSettingsPage() {
  return (
    <div>
      <PageHeader title="Operations Settings" />
      <OperationsSettings />
    </div>
  );
}
