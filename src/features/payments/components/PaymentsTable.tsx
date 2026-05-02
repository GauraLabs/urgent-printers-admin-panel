'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ExportButton } from '@/components/common/ExportButton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePayments } from '../hooks/usePayments';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { Payment, PaymentStatus } from '@/types';

export function PaymentsTable() {
  const { query, filters, setPage, setSearch, setStatus, clearFilters } = usePayments();
  const payments = query.data?.items ?? [];

  const columns: ColumnDef<Payment, unknown>[] = [
    {
      id: 'transaction_id',
      header: 'Transaction',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">{row.original.transaction_id}</span>
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
        <div className="min-w-[140px]">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{row.original.customer_name}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">{row.original.customer_email}</p>
        </div>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">{row.original.method}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{row.original.provider}</p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-xs font-semibold tabular-nums">{formatPrice(row.original.amount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <PaymentStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'paid_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">
          {row.original.paid_at ? formatDateTime(row.original.paid_at) : '—'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      isLoading={query.isLoading}
      page={filters.page}
      pageSize={filters.page_size}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(row) => row.id}
      emptyMessage="No payments found."
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Search order, customer…" onChange={setSearch} className="w-52" />
          <Select value={filters.status ?? ''} onValueChange={(v) => setStatus(v ? v as PaymentStatus : undefined)}>
            <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          {(filters.search || filters.status) && (
            <button onClick={clearFilters} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 py-1 border border-[var(--border)] rounded-md">Clear</button>
          )}
          <ExportButton
            filename="payments"
            getData={() => payments.map((p) => ({
              transaction_id: p.transaction_id,
              order: p.order_number,
              customer: p.customer_name,
              method: p.method,
              provider: p.provider,
              amount: p.amount,
              status: p.status,
              date: p.paid_at ?? '',
            }))}
          />
        </div>
      }
    />
  );
}
