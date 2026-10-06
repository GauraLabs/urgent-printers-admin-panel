'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { usePriceMismatchSummary } from '../hooks/usePriceMismatches';

export function PriceMismatchTile() {
  const { can } = usePermissions();
  const allowed = can('system.view');
  const { data } = usePriceMismatchSummary(7, allowed);
  if (!allowed) return null;
  const count = data?.by_cause.unexplained ?? null;
  const bad = (count ?? 0) > 0;
  return (
    <Link
      href="/system/price-mismatches"
      className={cn(
        'inline-flex flex-col rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50',
        bad ? 'border-red-300 bg-red-50/60 dark:border-red-700/50 dark:bg-red-950/20' : 'border-border bg-card',
      )}
    >
      <span className="text-[12px] text-muted-foreground">Unexplained price mismatches (7d)</span>
      <span className={cn('text-2xl font-semibold tabular-nums', bad ? 'text-red-700 dark:text-red-300' : 'text-foreground')}>
        {count ?? '—'}
      </span>
    </Link>
  );
}
