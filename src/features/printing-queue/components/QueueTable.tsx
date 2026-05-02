'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { CheckCircle, RefreshCw, Truck, AlertCircle, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BatchDispatchDialog } from './BatchDispatchDialog';
import { Button } from '@/components/ui/button';
import {
  useApproveArtwork,
  useStartPrinting,
  useMarkReadyToDispatch,
  useRequestReupload,
} from '../hooks/usePrintingQueue';
import { formatDate } from '@/lib/utils/formatDate';
import { TurnaroundBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { PrintingQueueItem, QueueStatus } from '@/lib/api/printingQueue';

const ARTWORK_LABELS: Record<string, string> = {
  pending: 'Awaiting Upload',
  approved: 'Approved',
  rejected: 'Rejected',
  reupload_requested: 'Reupload Requested',
};

interface QueueTableProps {
  items: PrintingQueueItem[];
  tabStatus: QueueStatus;
  isLoading: boolean;
}

export function QueueTable({ items, tabStatus, isLoading }: QueueTableProps) {
  const [batchOrders, setBatchOrders] = useState<PrintingQueueItem[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [reuploadItem, setReuploadItem] = useState<PrintingQueueItem | null>(null);

  const approveArtwork = useApproveArtwork();
  const requestReupload = useRequestReupload();
  const startPrinting = useStartPrinting();
  const markReady = useMarkReadyToDispatch();

  async function handleApprove(item: PrintingQueueItem) {
    try {
      await approveArtwork.mutateAsync({ orderId: item.order_id });
      toast.success(`${item.order_number} artwork approved`);
    } catch { toast.error('Failed to approve artwork'); }
  }

  async function handleStartPrinting(item: PrintingQueueItem) {
    try {
      await startPrinting.mutateAsync({ orderId: item.order_id });
      toast.success(`${item.order_number} moved to Printing`);
    } catch { toast.error('Failed to start printing'); }
  }

  async function handleMarkReady(item: PrintingQueueItem) {
    try {
      await markReady.mutateAsync({ orderId: item.order_id });
      toast.success(`${item.order_number} ready to dispatch`);
    } catch { toast.error('Failed to update status'); }
  }

  async function handleReuploadConfirm() {
    if (!reuploadItem) return;
    try {
      await requestReupload.mutateAsync({ orderId: reuploadItem.order_id, reason: 'File quality issue' });
      toast.success(`Reupload requested for ${reuploadItem.order_number}`);
      setReuploadItem(null);
    } catch { toast.error('Failed to request reupload'); }
  }

  const columns: ColumnDef<PrintingQueueItem, unknown>[] = [
    {
      id: 'order_number',
      accessorKey: 'order_number',
      header: 'Order',
      cell: ({ row }) => (
        <Link href={ROUTES.ORDER_DETAIL(row.original.order_id)} className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline">
          {row.original.order_number}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <p className="text-xs text-[var(--text-secondary)] truncate max-w-[130px]">{row.original.customer_name}</p>
      ),
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{row.original.product_name}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">{row.original.config_summary}</p>
        </div>
      ),
    },
    {
      id: 'quantity',
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => <span className="text-xs tabular-nums font-medium">{row.original.quantity.toLocaleString()}</span>,
    },
    {
      id: 'turnaround',
      header: 'Type',
      cell: ({ row }) => (
        <TurnaroundBadge type={row.original.turnaround} />
      ),
    },
    {
      id: 'order_date',
      header: 'Ordered',
      cell: ({ row }) => <span className="text-xs text-[var(--text-muted)]">{formatDate(row.original.order_date)}</span>,
    },
    {
      id: 'dispatch',
      header: 'Est. Dispatch',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-secondary)]">{formatDate(row.original.estimated_dispatch, 'dd MMM')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 200,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {item.status === 'artwork_pending' && (
              <>
                <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => handleApprove(item)} disabled={approveArtwork.isPending}>
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 border-[var(--warning-border)] text-[var(--warning)]" onClick={() => setReuploadItem(item)}>
                  <AlertCircle className="h-3.5 w-3.5" /> Reupload
                </Button>
                {item.artwork_file_url && (
                  <a href={item.artwork_file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="View artwork">
                    <FileImage className="h-4 w-4" />
                  </a>
                )}
              </>
            )}
            {item.status === 'artwork_approved' && (
              <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => handleStartPrinting(item)} disabled={startPrinting.isPending}>
                <RefreshCw className="h-3.5 w-3.5" /> Start Printing
              </Button>
            )}
            {item.status === 'printing' && (
              <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => handleMarkReady(item)} disabled={markReady.isPending}>
                <CheckCircle className="h-3.5 w-3.5" /> Mark Complete
              </Button>
            )}
            {item.status === 'ready_to_dispatch' && (
              <Button size="sm" className="h-7 text-xs px-2.5 bg-[var(--success)] hover:bg-green-600 text-white"
                onClick={() => { setBatchOrders([item]); setBatchOpen(true); }}>
                <Truck className="h-3.5 w-3.5" /> Create Shipment
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        enableRowSelection
        compact
        getRowId={(row) => row.id}
        emptyMessage={`No orders in this queue right now.`}
        bulkActions={(rows, clear) => {
          if (tabStatus === 'artwork_pending') {
            return (
              <Button size="sm" className="h-7 text-xs"
                onClick={async () => {
                  try {
                    await Promise.all(rows.map((r) => approveArtwork.mutateAsync({ orderId: r.order_id })));
                    toast.success(`${rows.length} artworks approved`);
                    clear();
                  } catch { toast.error('Some approvals failed'); }
                }}
                disabled={approveArtwork.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve {rows.length} artworks
              </Button>
            );
          }
          if (tabStatus === 'ready_to_dispatch') {
            return (
              <Button size="sm" className="h-7 text-xs"
                onClick={() => { setBatchOrders(rows); setBatchOpen(true); }}
              >
                <Truck className="h-3.5 w-3.5" /> Dispatch {rows.length} orders
              </Button>
            );
          }
          return null;
        }}
      />

      <BatchDispatchDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        orders={batchOrders}
        onSuccess={() => setBatchOrders([])}
      />

      <ConfirmDialog
        open={!!reuploadItem}
        onOpenChange={(v) => !v && setReuploadItem(null)}
        title={`Request reupload for ${reuploadItem?.order_number}?`}
        description="The customer will be notified to upload a new artwork file. Their order remains on hold until a new file is approved."
        confirmLabel="Request Reupload"
        onConfirm={handleReuploadConfirm}
        isLoading={requestReupload.isPending}
        variant="warning"
      />
    </>
  );
}
