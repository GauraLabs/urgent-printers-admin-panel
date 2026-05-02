'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Mail, MessageSquare, Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/StatusBadge';
import { useCommunicationLog } from '../hooks/useCommunications';
import { formatDateTime } from '@/lib/utils/formatDate';
import type { CommunicationLog as LogEntry } from '@/lib/api/communications';

const TYPE_ICON = { email: Mail, sms: MessageSquare, push: Bell };
const STATUS_VARIANT = { sent: 'success', failed: 'danger', pending: 'warning' } as const;

export function CommunicationLog() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCommunicationLog(page);

  const columns: ColumnDef<LogEntry, unknown>[] = [
    {
      id: 'type',
      header: 'Channel',
      size: 80,
      cell: ({ row }) => {
        const Icon = TYPE_ICON[row.original.type] ?? Mail;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] capitalize text-foreground">{row.original.type}</span>
          </div>
        );
      },
    },
    {
      id: 'recipient',
      header: 'Recipient',
      cell: ({ row }) => <span className="text-[13px] text-foreground font-mono text-xs">{row.original.recipient}</span>,
    },
    {
      id: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground truncate max-w-[200px] block">
          {row.original.subject ?? '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          label={row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
          variant={STATUS_VARIANT[row.original.status] ?? 'default'}
          dot
        />
      ),
    },
    {
      id: 'sent_at',
      header: 'Sent At',
      cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{formatDateTime(row.original.sent_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      page={page}
      pageSize={20}
      total={data?.total}
      onPageChange={setPage}
      compact
      getRowId={(r) => r.id}
      emptyMessage="No communication history yet."
    />
  );
}
