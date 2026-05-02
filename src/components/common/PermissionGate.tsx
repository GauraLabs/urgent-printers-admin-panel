import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/utils/permissions';
import type { Permission } from '@/types';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !hasPermission(user.role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
