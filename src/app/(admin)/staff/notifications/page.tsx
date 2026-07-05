import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StaffNotificationsMatrix } from '@/features/staff/components/StaffNotificationsMatrix';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Staff Notification Preferences' };

export default function StaffNotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Staff Notification Preferences"
        description="Choose which channels each staff member is notified on for platform events."
        actions={
          <Link href={ROUTES.STAFF} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Staff
          </Link>
        }
      />
      <StaffNotificationsMatrix />
    </div>
  );
}
