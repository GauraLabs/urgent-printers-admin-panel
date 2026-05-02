import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActivityLogTable } from '@/features/staff/components/ActivityLogTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Activity Log' };

export default function ActivityLogPage() {
  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Complete audit trail of all admin actions."
        actions={
          <Link href={ROUTES.STAFF} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Staff
          </Link>
        }
      />
      <ActivityLogTable />
    </div>
  );
}
