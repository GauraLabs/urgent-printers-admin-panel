import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TemplatesManager } from '@/features/communications/components/TemplatesManager';
import { WhatsAppTemplatesManager } from '@/features/communications/components/WhatsAppTemplatesManager';
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

      <section className="space-y-3 mb-10">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Notification Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Email, SMS, and push notification templates.</p>
        </div>
        <TemplatesManager />
      </section>

      <section className="space-y-3">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">WhatsApp Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Meta-approved WhatsApp Business message templates.</p>
        </div>
        <WhatsAppTemplatesManager />
      </section>
    </div>
  );
}
