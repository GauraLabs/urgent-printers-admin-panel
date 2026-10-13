'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable';
import { ExportButton } from '@/components/common/ExportButton';
import { useRefunds } from '../hooks/usePayments';
import { RefundStatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDateTime } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import type { Refund } from '@/types';

const REASON_LABELS: Record<string, string> = {
  customer_request: 'Customer Request',
  quality_issue: 'Quality Issue',
  order_cancelled: 'Order Cancelled',
  wrong_item: 'Wrong Item',
  damaged: 'Damaged',
  other: 'Other',
};

export function RefundsTable() {
  const { query, filters, setPage } = useRefunds();
  const refunds = query.data?.items ?? [];

  const columns: ColumnDef<Refund, unknown>[] = [
    {
      id: 'id',
      header: 'Refund ID',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">{row.original.refund_id}</span>
      ),
    },
    {
      id: 'order',
      header: 'Order',
      cell: ({ row }) => (
        <Link href={ROUTES.ORDER_DETAIL(row.original.order_id)} className="text-xs font-semibold font-mono text-[var(--primary)] hover:underline">
          {row.original.order_number}
        </Link>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-xs font-semibold tabular-nums text-[var(--danger)]">
          -{formatPrice(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-secondary)]">{row.original.reason ? (REASON_LABELS[row.original.reason] ?? row.original.reason) : '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <RefundStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'processed_by',
      header: 'Processed By',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">{row.original.created_by ?? '—'}</span>
      ),
    },
    {
      id: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">{row.original.created_at ? formatDateTime(row.original.created_at) : '—'}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={refunds}
      isLoading={query.isLoading}
      page={filters.page}
      pageSize={filters.page_size}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(row) => row.order_id}
      emptyMessage="No refunds found."
      toolbar={
        <ExportButton
          filename="refunds"
          getData={() => refunds.map((r) => ({
            refund_id: r.refund_id,
            order: r.order_number,
            amount: r.amount,
            reason: r.reason ? (REASON_LABELS[r.reason] ?? r.reason) : '',
            status: r.status,
            date: r.created_at ?? '',
          }))}
        />
      }
    />
  );
}
