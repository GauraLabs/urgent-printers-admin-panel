import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminShellContent } from '@/components/layout/AdminShellContent';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminSidebar />
      <AdminHeader />
      <AdminShellContent>{children}</AdminShellContent>
    </AuthGuard>
  );
}
