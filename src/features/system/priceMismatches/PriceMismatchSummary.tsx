'use client';

import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { MISMATCH_CAUSES } from '@/lib/api/priceMismatches';
import { formatIst } from '@/lib/utils/istDate';
import { usePriceMismatchSummary } from '../hooks/usePriceMismatches';
import { CAUSE_META } from './causes';

export function PriceMismatchSummary() {
  const { data, isLoading, isError } = usePriceMismatchSummary(7);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MISMATCH_CAUSES.map((c) => <Skeleton key={c} className="h-24 rounded-lg" />)}
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-[13px] text-muted-foreground">Could not load the mismatch summary.</p>;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MISMATCH_CAUSES.map((cause) => {
        const meta = CAUSE_META[cause];
        const unexplained = cause === 'unexplained';
        const alert = unexplained && data.unexplained_unresolved > 0;
        return (
          <div
            key={cause}
            data-testid={`summary-${cause}`}
            className={cn(
              'rounded-lg border bg-card p-4',
              unexplained && 'col-span-2 lg:col-span-1 border-red-300 dark:border-red-700/50 bg-red-50/60 dark:bg-red-950/20',
              alert && 'ring-1 ring-red-400/60',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[12px] font-medium', unexplained ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground')}>
                {meta.label}
              </span>
              {unexplained && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Last 7 days</p>
            <p className={cn('font-semibold tabular-nums', unexplained ? 'text-3xl text-red-700 dark:text-red-300' : 'text-2xl text-foreground')}>
              {data.by_cause[cause]}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{meta.help}</p>
            {unexplained && (
              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/40 text-[11px] text-muted-foreground space-y-0.5">
                <p>Open (all time): <span className="font-semibold text-foreground">{data.unexplained_unresolved}</span></p>
                <p>Last unexplained (all time): {data.last_unexplained_at ? formatIst(data.last_unexplained_at) : 'never'}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
