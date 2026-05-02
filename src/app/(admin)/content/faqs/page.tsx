import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { FaqsManager } from '@/features/content/components/FaqsManager';

export const metadata: Metadata = { title: 'FAQs' };

export default function FaqsPage() {
  return (
    <div>
      <PageHeader title="FAQs" description="Manage frequently asked questions grouped by category." />
      <FaqsManager />
    </div>
  );
}
