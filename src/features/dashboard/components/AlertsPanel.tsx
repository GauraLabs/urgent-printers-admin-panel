'use client';

import Link from 'next/link';
import { AlertTriangle, XCircle, Clock, ImageOff } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { DashboardAlert } from '@/types';

const ALERT_ICONS = {
  artwork_pending: ImageOff,
  order_stuck: Clock,
  failed_payment: XCircle,
  low_product: AlertTriangle,
} as const;

interface AlertsPanelProps {
  alerts: DashboardAlert[] | undefined;
  isLoading: boolean;
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  function getHref(alert: DashboardAlert): string {
    if (alert.entity_type === 'order' && alert.entity_id) return ROUTES.ORDER_DETAIL(alert.entity_id);
    if (alert.type === 'artwork_pending') return ROUTES.PRINTING_QUEUE;
    if (alert.type === 'failed_payment') return ROUTES.PAYMENTS;
    return ROUTES.DASHBOARD;
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Alerts</h3>
        <p className="text-xs text-[var(--text-muted)]">Items requiring your attention</p>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-[var(--surface-secondary)] animate-pulse" />
          ))}
        </div>
      ) : !alerts?.length ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-10 h-10 rounded-full bg-[var(--success-bg)] flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">All clear</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">No alerts right now</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.type] ?? AlertTriangle;
            const isError = alert.severity === 'error';
            return (
              <li key={alert.id}>
                <Link
                  href={getHref(alert)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <div
                    className={cn(
                      'mt-0.5 flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                      isError ? 'bg-[var(--danger-bg)]' : 'bg-[var(--warning-bg)]'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        isError ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                      {alert.description}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {formatTimeAgo(alert.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
