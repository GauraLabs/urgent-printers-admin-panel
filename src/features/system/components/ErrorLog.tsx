'use client';

import { AlertTriangle, XCircle, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useErrorLog } from '../hooks/useSystemHealth';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { ErrorLogEntry } from '@/lib/api/system';

const LEVEL_CONFIG = {
  warning: {
    icon: AlertTriangle,
    cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40',
    iconCls: 'text-amber-500',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40',
    iconCls: 'text-red-500',
    label: 'Error',
  },
  critical: {
    icon: Flame,
    cls: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40',
    iconCls: 'text-orange-500',
    label: 'Critical',
  },
} as const;

function ErrorEntry({ entry, index }: { entry: ErrorLogEntry; index: number }) {
  const cfg = LEVEL_CONFIG[entry.level];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12, delay: index * 0.03 }}
      className={cn('flex items-start gap-3 px-4 py-3 rounded-lg border', cfg.cls)}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', cfg.iconCls)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-[13px] font-medium text-foreground leading-snug">{entry.message}</p>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{formatTimeAgo(entry.created_at)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {entry.endpoint && (
            <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
              {entry.endpoint}
            </code>
          )}
          {entry.user_id && (
            <span className="text-[11px] text-muted-foreground">
              User: <code className="font-mono">{entry.user_id}</code>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ErrorLog() {
  const { data: errors, isLoading } = useErrorLog();

  const critical = errors?.filter((e) => e.level === 'critical').length ?? 0;
  const errCount = errors?.filter((e) => e.level === 'error').length ?? 0;
  const warnings = errors?.filter((e) => e.level === 'warning').length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" style={{ animationDelay: `${i * 0.04}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4 text-[13px]">
        {critical > 0 && <span className="font-semibold text-orange-600 dark:text-orange-400">{critical} critical</span>}
        {errCount > 0 && <span className="font-medium text-red-600 dark:text-red-400">{errCount} errors</span>}
        {warnings > 0 && <span className="text-amber-600 dark:text-amber-400">{warnings} warnings</span>}
        {!errors?.length && <span className="text-emerald-600 dark:text-emerald-400 font-medium">No errors recorded</span>}
      </div>

      {errors && errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((entry, i) => (
            <ErrorEntry key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
