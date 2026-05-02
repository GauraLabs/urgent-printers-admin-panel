import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { NotificationSettings } from '@/features/settings/components/NotificationSettings';

export const metadata: Metadata = { title: 'Notifications Settings' };

export default function NotificationSettingsPage() {
  return (
    <div>
      <PageHeader title="Notifications Settings" />
      <NotificationSettings />
    </div>
  );
}
