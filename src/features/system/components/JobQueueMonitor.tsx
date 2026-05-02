'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { useJobQueue } from '../hooks/useSystemHealth';
import { formatDateTime, formatTimeAgo } from '@/lib/utils/formatDate';
import type { JobStatus } from '@/types';
import type { BadgeVariant } from '@/components/common/StatusBadge';

const JOB_STATUS_VARIANT: Record<JobStatus['status'], BadgeVariant> = {
  queued:     'default',
  processing: 'info',
  completed:  'success',
  failed:     'danger',
  retrying:   'warning',
};

export function JobQueueMonitor() {
  const { data: jobs, isLoading } = useJobQueue();

  const queued    = jobs?.filter((j) => j.status === 'queued').length ?? 0;
  const processing = jobs?.filter((j) => j.status === 'processing').length ?? 0;
  const failed    = jobs?.filter((j) => j.status === 'failed').length ?? 0;

  const columns: ColumnDef<JobStatus, unknown>[] = [
    {
      id: 'type',
      header: 'Job',
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] font-medium text-foreground">{row.original.job_type.replace(/_/g, ' ')}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{row.original.queue_name}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          label={row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
          variant={JOB_STATUS_VARIANT[row.original.status]}
          dot
        />
      ),
    },
    {
      id: 'retries',
      header: 'Retries',
      cell: ({ row }) => (
        <span className={`text-[13px] tabular-nums font-medium ${row.original.retry_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
          {row.original.retry_count}
        </span>
      ),
    },
    {
      id: 'error',
      header: 'Error',
      cell: ({ row }) => row.original.error_message ? (
        <p className="text-[12px] text-red-600 dark:text-red-400 truncate max-w-[200px]">{row.original.error_message}</p>
      ) : <span className="text-muted-foreground text-[13px]">—</span>,
    },
    {
      id: 'created',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">{formatTimeAgo(row.original.created_at)}</span>
      ),
    },
    {
      id: 'completed',
      header: 'Completed',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">
          {row.original.completed_at ? formatTimeAgo(row.original.completed_at) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Quick stats */}
      <div className="flex items-center gap-4 text-[13px]">
        <span className="text-muted-foreground">{queued} queued</span>
        <span className="text-blue-600 dark:text-blue-400 font-medium">{processing} processing</span>
        {failed > 0 && <span className="text-red-600 dark:text-red-400 font-semibold">{failed} failed</span>}
      </div>

      <DataTable
        columns={columns}
        data={jobs ?? []}
        isLoading={isLoading}
        compact
        getRowId={(r) => r.id}
        emptyMessage="No jobs in queue."
      />
    </div>
  );
}
