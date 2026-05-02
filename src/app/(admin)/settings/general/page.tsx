import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { GeneralSettings } from '@/features/settings/components/GeneralSettings';

export const metadata: Metadata = { title: 'General Settings' };

export default function GeneralSettingsPage() {
  return (
    <div>
      <PageHeader title="General Settings" />
      <GeneralSettings />
    </div>
  );
}
