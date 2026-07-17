import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { NavLinksManager } from '@/features/content/components/NavLinksManager';

export const metadata: Metadata = { title: 'Navigation' };

export default function NavigationPage() {
  return (
    <div>
      <PageHeader title="Navigation" description="Manage header and footer navigation links." />
      <NavLinksManager />
    </div>
  );
}
