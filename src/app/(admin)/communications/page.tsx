import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SendNotificationForm } from '@/features/communications/components/SendNotificationForm';
import { CommunicationLog } from '@/features/communications/components/CommunicationLog';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Communications' };

export default function CommunicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Send Notification"
          description="Broadcast messages to customers via email, SMS, or push."
          actions={
            <Link href={ROUTES.COMM_TEMPLATES} className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              Manage Templates →
            </Link>
          }
        />
        <SendNotificationForm />
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-foreground mb-4">Send History</h2>
        <CommunicationLog />
      </div>
    </div>
  );
}
