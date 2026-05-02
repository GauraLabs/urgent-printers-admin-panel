'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable';
import { ExportButton } from '@/components/common/ExportButton';
import { useRefunds } from '../hooks/usePayments';
import { RefundStatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { Refund, RefundStatus } from '@/types';

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
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">{row.original.id}</span>
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
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-primary)]">{row.original.customer_name}</span>
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
        <span className="text-xs text-[var(--text-secondary)]">{REASON_LABELS[row.original.reason] ?? row.original.reason}</span>
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
        <span className="text-xs text-[var(--text-muted)]">{row.original.processed_by_name ?? '—'}</span>
      ),
    },
    {
      id: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">{formatDateTime(row.original.created_at)}</span>
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
      getRowId={(row) => row.id}
      emptyMessage="No refunds found."
      toolbar={
        <ExportButton
          filename="refunds"
          getData={() => refunds.map((r) => ({
            id: r.id,
            order: r.order_number,
            customer: r.customer_name,
            amount: r.amount,
            reason: REASON_LABELS[r.reason] ?? r.reason,
            status: r.status,
            date: r.created_at,
          }))}
        />
      }
    />
  );
}
