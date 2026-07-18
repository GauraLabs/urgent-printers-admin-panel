'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/StatusBadge';
import { ExportButton } from '@/components/common/ExportButton';
import { useShipments } from '../hooks/useShipping';
import { ShipmentStatusControl } from './ShipmentStatusControl';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_VARIANT } from '@/lib/constants/shipmentStatus';
import type { Shipment } from '@/types';

export function ShipmentsTable() {
  const { query, page, setPage } = useShipments();
  const { canManageShipping } = usePermissions();
  const shipments = query.data?.items ?? [];

  const columns: ColumnDef<Shipment, unknown>[] = [
    {
      id: 'tracking',
      header: 'Tracking #',
      cell: ({ row }) => (
        <span className="font-mono text-[12px] font-semibold text-foreground">{row.original.tracking_number ?? '—'}</span>
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
      cell: ({ row }) => <span className="text-[13px] text-foreground">{row.original.customer_name ?? '—'}</span>,
    },
    {
      id: 'courier',
      header: 'Courier',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{row.original.courier ?? '—'}</span>
          {row.original.shipment_source === 'manual' && (
            <Badge label="Manual" variant="warning" dot={false} />
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { shipment_status, shipment_source, order_id } = row.original;
        if (!shipment_status) return <span className="text-[13px] text-muted-foreground">—</span>;
        if (shipment_source === 'manual' && canManageShipping) {
          return <ShipmentStatusControl orderId={order_id} currentStatus={shipment_status} size="sm" />;
        }
        return (
          <Badge
            label={SHIPMENT_STATUS_LABEL[shipment_status]}
            variant={SHIPMENT_STATUS_VARIANT[shipment_status]}
            dot
          />
        );
      },
    },
    {
      id: 'dispatched',
      header: 'Dispatched',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.dispatched_at ? formatDate(row.original.dispatched_at) : '—'}
        </span>
      ),
    },
    {
      id: 'eta',
      header: 'Est. Delivery',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.estimated_delivery_date ? formatDate(row.original.estimated_delivery_date) : '—'}
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
      getRowId={(r) => r.order_id}
      emptyMessage="No shipments found."
      toolbar={
        <ExportButton
          filename="shipments"
          getData={() => shipments.map((s) => ({
            tracking_number: s.tracking_number ?? '',
            order: s.order_number,
            customer: s.customer_name ?? '',
            courier: s.courier ?? '',
            source: s.shipment_source ?? '',
            status: s.shipment_status ?? '',
            dispatched: s.dispatched_at ?? '',
            eta: s.estimated_delivery_date ?? '',
          }))}
        />
      }
    />
  );
}
