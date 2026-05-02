'use client';

import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { ServiceStatus } from '@/types';

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    label: 'Healthy',
  },
  degraded: {
    icon: AlertTriangle,
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
    label: 'Degraded',
  },
  down: {
    icon: XCircle,
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/60',
    label: 'Down',
  },
} as const;

function ServiceCard({ service, index }: { service: ServiceStatus; index: number }) {
  const cfg = STATUS_CONFIG[service.status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className={cn('bg-card rounded-xl p-4 border', cfg.border)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated pulse dot for status */}
          <span className="relative flex-shrink-0">
            <span className={cn('w-2.5 h-2.5 rounded-full block', cfg.dot)} />
            {service.status === 'healthy' && (
              <span className={cn('absolute inset-0 rounded-full animate-ping opacity-50', cfg.dot)} />
            )}
          </span>
          <p className="text-[13px] font-semibold text-foreground truncate">{service.name}</p>
        </div>
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0', cfg.badge)}>
          {cfg.label}
        </span>
      </div>

      <div className="space-y-1.5 text-[12px]">
        {service.response_time_ms !== null && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Response</span>
            <span className={cn('font-medium tabular-nums', service.response_time_ms > 500 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
              {service.response_time_ms}ms
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Error rate</span>
          <span className={cn('font-medium tabular-nums', service.error_rate > 1 ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
            {service.error_rate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Checked</span>
          <span className="text-foreground">{formatTimeAgo(service.last_check)}</span>
        </div>
        {service.message && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
            {service.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ServiceHealthCards({ onRefresh, isFetching }: { onRefresh: () => void; isFetching: boolean }) {
  const { data, isLoading } = useSystemHealth();

  const healthy = data?.services.filter((s) => s.status === 'healthy').length ?? 0;
  const total = data?.services.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        {!isLoading && data && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className={cn('font-semibold', healthy === total ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {healthy}/{total} services healthy
            </span>
            {data.checked_at && (
              <span className="text-muted-foreground">· {formatTimeAgo(data.checked_at)}</span>
            )}
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 ml-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" style={{ animationDelay: `${i * 0.04}s` }} />
            ))
          : data?.services.map((service, i) => (
              <ServiceCard key={service.name} service={service} index={i} />
            ))}
      </div>
    </div>
  );
}
