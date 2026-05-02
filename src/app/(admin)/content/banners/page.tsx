import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { BannersManager } from '@/features/content/components/BannersManager';

export const metadata: Metadata = { title: 'Banners' };

export default function BannersPage() {
  return (
    <div>
      <PageHeader title="Banners" description="Manage homepage banner slides. Drag to reorder." />
      <BannersManager />
    </div>
  );
}
