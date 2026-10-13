'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { PermissionGate } from '@/components/common/PermissionGate';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/StatusBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePaymentAnomalies, useStuckPayments } from '../hooks/usePayments';
import { ANOMALY_EVENT_LABELS, anomalyLabel, paiseToRupees } from '../utils/anomalyLabels';
import { formatPrice2 } from '@/lib/utils/formatPrice';
import { formatDateTime } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { PaymentAnomaly } from '@/types';

function money(paise: number | null): string {
  const rupees = paiseToRupees(paise);
  return rupees == null ? '—' : formatPrice2(rupees);
}

const columns: ColumnDef<PaymentAnomaly, unknown>[] = [
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
    id: 'event_type',
    header: 'Event',
    cell: ({ row }) => <span className="text-xs text-[var(--text-primary)]">{anomalyLabel(row.original.event_type)}</span>,
  },
  {
    id: 'amounts',
    header: 'Event / order total',
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-[var(--text-secondary)]">
        {money(row.original.event_amount_paise)} / {money(row.original.order_total_paise)}
      </span>
    ),
  },
  {
    id: 'state',
    header: 'Order / payment',
    cell: ({ row }) => (
      <span className="text-xs text-[var(--text-secondary)]">
        {row.original.order_status.replace(/_/g, ' ')} / {row.original.payment_status.replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    id: 'razorpay',
    header: 'Razorpay',
    cell: ({ row }) => (
      <div className="font-mono text-[11px] text-[var(--text-muted)] leading-tight">
        <p>{row.original.razorpay_order_id ?? '—'}</p>
        <p>{row.original.razorpay_payment_id ?? '—'}</p>
      </div>
    ),
  },
  {
    id: 'refund_id',
    header: 'Refund',
    cell: ({ row }) => (
      row.original.refund_unconfirmed
        ? <Badge label="Unconfirmed" variant="danger" />
        : <span className="font-mono text-[11px] text-[var(--text-secondary)]">{row.original.refund_id ?? '—'}</span>
    ),
  },
  {
    id: 'resolved',
    header: 'Status',
    cell: ({ row }) => (
      <Badge label={row.original.resolved ? 'Resolved' : 'Needs review'} variant={row.original.resolved ? 'success' : 'danger'} />
    ),
  },
  {
    id: 'created_at',
    header: 'When',
    cell: ({ row }) => <span className="text-xs text-[var(--text-muted)]">{formatDateTime(row.original.created_at)}</span>,
  },
];

function AnomaliesTab() {
  const { query, filters, setPage, setEventType, setUnresolvedOnly } = usePaymentAnomalies();
  return (
    <DataTable
      columns={columns}
      data={query.data?.items ?? []}
      isLoading={query.isLoading}
      page={filters.page}
      pageSize={filters.page_size}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(row) => row.event_id}
      emptyMessage="No payment anomalies found."
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.event_type ?? ''} onValueChange={(v) => setEventType(v || undefined)}>
            <SelectTrigger size="sm" className="w-56"><SelectValue placeholder="All event types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All event types</SelectItem>
              {Object.entries(ANOMALY_EVENT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={filters.unresolved_only ?? false}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
            />
            Unresolved only
          </label>
        </div>
      }
    />
  );
}

function StuckTab() {
  const { query, page, setPage } = useStuckPayments();
  return (
    <DataTable
      columns={columns}
      data={query.data?.items ?? []}
      isLoading={query.isLoading}
      page={page}
      pageSize={20}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(row) => row.event_id}
      emptyMessage="No stuck payments."
    />
  );
}

type Tab = 'anomalies' | 'stuck';

export function PaymentAnomaliesView() {
  const [tab, setTab] = useState<Tab>('anomalies');
  return (
    <PermissionGate
      permission="payments.view"
      fallback={<p className="text-[13px] text-muted-foreground">You do not have permission to view payment anomalies.</p>}
    >
      <div className="space-y-4">
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="tablist">
          {([['anomalies', 'Anomalies'], ['stuck', 'Stuck payments']] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors',
                tab === value ? 'bg-[var(--surface-secondary)] font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'anomalies' ? <AnomaliesTab /> : <StuckTab />}
      </div>
    </PermissionGate>
  );
}
