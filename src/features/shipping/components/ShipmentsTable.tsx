'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/StatusBadge';
import { ExportButton } from '@/components/common/ExportButton';
import { useShipments } from '../hooks/useShipping';
import { formatDate } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import type { Shipment } from '@/types';

type ShipStatus = Shipment['status'];

const STATUS_VARIANT: Record<ShipStatus, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  created: 'default',
  picked_up: 'info',
  in_transit: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  failed: 'danger',
};
const STATUS_LABEL: Record<ShipStatus, string> = {
  created: 'Created', picked_up: 'Picked Up', in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', failed: 'Failed',
};

export function ShipmentsTable() {
  const { query, page, setPage } = useShipments();
  const shipments = query.data?.items ?? [];

  const columns: ColumnDef<Shipment, unknown>[] = [
    {
      id: 'awb',
      header: 'AWB',
      cell: ({ row }) => (
        <span className="font-mono text-[12px] font-semibold text-foreground">{row.original.awb_number}</span>
      ),
    },
    {
      id: 'order',
      header: 'Order',
      cell: ({ row }) => (
        <Link href={ROUTES.ORDER_DETAIL(row.original.order_id)} className="text-[13px] font-mono font-semibold text-primary hover:underline">
          {row.original.order_number}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => <span className="text-[13px] text-foreground">{row.original.customer_name}</span>,
    },
    {
      id: 'courier',
      header: 'Courier',
      cell: ({ row }) => <span className="text-[13px] font-medium text-foreground">{row.original.courier}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge label={STATUS_LABEL[row.original.status]} variant={STATUS_VARIANT[row.original.status]} dot />,
    },
    {
      id: 'dispatched',
      header: 'Dispatched',
      cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{formatDate(row.original.dispatched_at)}</span>,
    },
    {
      id: 'eta',
      header: 'Est. Delivery',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.estimated_delivery ? formatDate(row.original.estimated_delivery) : '—'}
        </span>
      ),
    },
    {
      id: 'track',
      header: '',
      size: 48,
      cell: ({ row }) => row.original.tracking_url ? (
        <a href={row.original.tracking_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
          Track <ExternalLink className="h-3 w-3" />
        </a>
      ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={shipments}
      isLoading={query.isLoading}
      page={page}
      pageSize={20}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(r) => r.id}
      emptyMessage="No shipments found."
      toolbar={
        <ExportButton
          filename="shipments"
          getData={() => shipments.map((s) => ({
            awb: s.awb_number,
            order: s.order_number,
            customer: s.customer_name,
            courier: s.courier,
            status: s.status,
            dispatched: s.dispatched_at,
            eta: s.estimated_delivery ?? '',
          }))}
        />
      }
    />
  );
}
