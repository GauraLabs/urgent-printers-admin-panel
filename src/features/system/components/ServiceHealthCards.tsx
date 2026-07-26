'use client';

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw, Clock, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useSystemHealth, useForceCheckService } from '../hooks/useSystemHealth';
import { usePermissions } from '@/hooks/usePermissions';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApiError } from '@/types';
import type { ServiceStatus, ServiceHealthStatus } from '@/types';
import type { ForceCheckableService } from '@/lib/api/system';
import type { UseMutationResult } from '@tanstack/react-query';

const STATUS_CONFIG: Record<ServiceHealthStatus, {
  icon: typeof CheckCircle2;
  dot: string;
  badge: string;
  border: string;
  label: string;
}> = {
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
  unknown: {
    icon: HelpCircle,
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700/60',
    label: 'Unknown',
  },
};

type ForceCheckMutation = UseMutationResult<ServiceStatus, unknown, ForceCheckableService, unknown>;

function ServiceCard({
  service,
  index,
  canForceCheck,
  forceCheckMutation,
}: {
  service: ServiceStatus;
  index: number;
  canForceCheck: boolean;
  forceCheckMutation: ForceCheckMutation;
}) {
  const cfg = STATUS_CONFIG[service.status];
  const Icon = cfg.icon;
  const isChecking = forceCheckMutation.isPending && forceCheckMutation.variables === service.name;

  function handleForceCheck() {
    forceCheckMutation.mutate(service.name as ForceCheckableService, {
      onSuccess: () => toast.success(`${service.display_name} re-checked`),
      onError: (err) => {
        const apiErr = err as ApiError;
        if (apiErr.status === 429) {
          toast.error(apiErr.message || `${service.display_name} was checked recently — try again shortly.`);
        } else {
          toast.error(`Failed to check ${service.display_name}.`);
        }
      },
    });
  }

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
          <p className="text-[13px] font-semibold text-foreground truncate">{service.display_name}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full', cfg.badge)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
          {canForceCheck && (
            <button
              onClick={handleForceCheck}
              disabled={isChecking}
              title={`Re-check ${service.display_name}`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={cn('h-3 w-3', isChecking && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-[12px]">
        {service.response_time_ms != null && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Response</span>
            <span className={cn('font-medium tabular-nums', service.response_time_ms > 500 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
              {service.response_time_ms}ms
            </span>
          </div>
        )}
        {service.last_check && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Checked</span>
            <span className="text-foreground">{formatTimeAgo(service.last_check)}</span>
          </div>
        )}
        {service.category === 'external' && (
          <>
            {service.last_success_at && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Last success</span>
                <span className="text-foreground">{formatTimeAgo(service.last_success_at)}</span>
              </div>
            )}
            {service.last_failure_at && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Last failure</span>
                <span className="text-red-600 dark:text-red-400">{formatTimeAgo(service.last_failure_at)}</span>
              </div>
            )}
            {!service.last_success_at && !service.last_failure_at && (
              <p className="text-muted-foreground text-[11px]">No traffic recorded yet</p>
            )}
          </>
        )}
        {service.message && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
            {service.message}
          </p>
        )}
        {service.last_error && (
          <p className="mt-2 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">
            {service.last_error}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ServiceHealthCards({ onRefresh, isFetching }: { onRefresh: () => void; isFetching: boolean }) {
  const { data, isLoading } = useSystemHealth();
  const { canManageSystem } = usePermissions();
  const forceCheckMutation = useForceCheckService();

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
              <ServiceCard
                key={service.name}
                service={service}
                index={i}
                canForceCheck={canManageSystem}
                forceCheckMutation={forceCheckMutation}
              />
            ))}
      </div>
    </div>
  );
}
