import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TemplatesManager } from '@/features/communications/components/TemplatesManager';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Notification Templates' };

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Notification Templates"
        description="Edit the templates used for order and system notifications."
        actions={
          <Link href={ROUTES.COMMUNICATIONS} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Send Notification
          </Link>
        }
      />
      <TemplatesManager />
    </div>
  );
}
