import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { StaffTable } from '@/features/staff/components/StaffTable';
import { RolePermissionsMatrix } from '@/features/staff/components/RolePermissionsMatrix';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Staff' };

export default function StaffPage() {
  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Staff"
          description="Manage admin accounts and access levels."
          actions={
            <div className="flex items-center gap-2">
              <Link href={ROUTES.STAFF_NOTIFICATIONS} className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                Notification Preferences →
              </Link>
              <Link href={ROUTES.ACTIVITY_LOG} className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                Activity Log →
              </Link>
            </div>
          }
        />
        <StaffTable />
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-foreground mb-4">Role Permissions Matrix</h2>
        <p className="text-[13px] text-muted-foreground mb-4">What each role can and cannot do across the panel.</p>
        <RolePermissionsMatrix />
      </div>
    </div>
  );
}
