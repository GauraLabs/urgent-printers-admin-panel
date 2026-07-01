'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { MoreHorizontal, Eye, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge, TurnaroundBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UpdateStatusDialog } from './UpdateStatusDialog';
import { OrderFilters } from './OrderFilters';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

export function OrdersTable() {
  const { query, filters, setPage, setSearch, setStatus, setTurnaround, setDateRange, sorting, setSorting } = useOrders();
  const cancelMutation = useCancelOrder();

  const [statusDialogOrder, setStatusDialogOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);

  const hasActiveFilters = !!(filters.search || filters.status || filters.turnaround || filters.date_from);

  function clearFilters() {
    setSearch('');
    setStatus(undefined);
    setTurnaround(undefined);
    setDateRange(undefined, undefined);
  }

  async function handleCancel() {
    if (!cancelOrder) return;
    try {
      await cancelMutation.mutateAsync({ id: cancelOrder.id, reason: 'Cancelled by admin' });
      toast.success(`${cancelOrder.order_number} cancelled`);
      setCancelOrder(null);
    } catch {
      toast.error('Failed to cancel order');
    }
  }

  const columns: ColumnDef<Order, unknown>[] = [
    {
      id: 'order_number',
      accessorKey: 'order_number',
      header: 'Order',
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          href={ROUTES.ORDER_DETAIL(row.original.id)}
          className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          {row.original.order_number}
        </Link>
      ),
    },
    {
      id: 'customer_name',
      accessorKey: 'customer_name',
      header: 'Customer',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">{row.original.customer_name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{row.original.customer_email}</p>
        </div>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.status as OrderStatus} />,
    },
    {
      id: 'turnaround',
      accessorKey: 'turnaround',
      header: 'Type',
      enableSorting: false,
      cell: ({ row }) => (
        <TurnaroundBadge type={row.original.turnaround} />
      ),
    },
    {
      id: 'total_amount',
      accessorKey: 'total_amount',
      header: 'Amount',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
          {formatPrice(row.original.total_amount)}
        </span>
      ),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Date',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-secondary)]">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      size: 48,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={ROUTES.ORDER_DETAIL(order.id)} className="flex items-center gap-2 w-full">
                  <Eye className="h-3.5 w-3.5" /> View Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusDialogOrder(order)}>
                <RefreshCw className="h-3.5 w-3.5" /> Update Status
              </DropdownMenuItem>
              {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCancelOrder(order)}
                    className="text-[var(--danger)] focus:text-[var(--danger)]"
                  >
                    Cancel Order
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        isLoading={query.isLoading}
        page={filters.page}
        pageSize={filters.page_size}
        total={query.data?.total}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        enableRowSelection
        compact
        toolbar={
          <OrderFilters
            search={filters.search}
            status={filters.status}
            turnaround={filters.turnaround}
            onSearch={setSearch}
            onStatus={setStatus}
            onTurnaround={setTurnaround}
            onDateRange={setDateRange}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        }
        bulkActions={(rows, clear) => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-bg)]"
            onClick={() => {
              toast(`Bulk cancel ${rows.length} orders — connect to real API`, { icon: '⚠️' });
              clear();
            }}
          >
            Cancel {rows.length} orders
          </Button>
        )}
        emptyMessage="No orders found matching your filters."
        getRowId={(row) => row.id}
      />

      {statusDialogOrder && (
        <UpdateStatusDialog
          open={!!statusDialogOrder}
          onOpenChange={(v) => !v && setStatusDialogOrder(null)}
          orderId={statusDialogOrder.id}
          orderNumber={statusDialogOrder.order_number}
          currentStatus={statusDialogOrder.status as OrderStatus}
        />
      )}

      <ConfirmDialog
        open={!!cancelOrder}
        onOpenChange={(v) => !v && setCancelOrder(null)}
        title={`Cancel ${cancelOrder?.order_number}?`}
        description="This will cancel the order and notify the customer. This action cannot be undone."
        confirmLabel="Yes, cancel order"
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
        variant="danger"
      />
    </>
  );
}
