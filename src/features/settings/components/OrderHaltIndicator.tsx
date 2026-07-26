'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useOrderHaltStatus } from '../hooks/useOrderHalt';
import { ROUTES } from '@/lib/constants/routes';

export function OrderHaltIndicator() {
  const { canViewSettings } = usePermissions();
  const { data: halt } = useOrderHaltStatus();

  if (!canViewSettings || !halt?.is_halted) return null;

  return (
    <Link
      href={ROUTES.SETTINGS_OPERATIONS}
      className="flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-[var(--danger)]/10 border border-[var(--danger)]/40 text-[var(--danger)] text-[12px] font-medium hover:bg-[var(--danger)]/20 transition-colors"
      title="New orders are halted site-wide — click to review"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Orders Halted</span>
    </Link>
  );
}
