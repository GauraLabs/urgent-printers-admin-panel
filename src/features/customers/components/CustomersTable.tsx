'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { MoreHorizontal, Eye, ShieldOff, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomers, useUpdateCustomerStatus } from '../hooks/useCustomers';
import { CustomerStatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate, formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { Customer, CustomerStatus } from '@/types';

export function CustomersTable() {
  const { query, filters, setPage, setSearch, setStatus, clearFilters } = useCustomers();
  const statusMutation = useUpdateCustomerStatus();
  const [confirmAction, setConfirmAction] = useState<{ customer: Customer; action: 'ban' | 'unban' } | null>(null);

  const hasFilters = !!(filters.search || filters.status);

  async function handleStatusChange() {
    if (!confirmAction) return;
    const { customer, action } = confirmAction;
    try {
      await statusMutation.mutateAsync({ id: customer.id, status: action === 'ban' ? 'banned' : 'active' });
      toast.success(`${customer.name} ${action === 'ban' ? 'banned' : 'reinstated'}`);
      setConfirmAction(null);
    } catch {
      toast.error('Failed to update customer status');
    }
  }

  const columns: ColumnDef<Customer, unknown>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Customer',
      enableSorting: true,
      cell: ({ row }) => {
        const c = row.original;
        const initials = c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="w-8 h-8 rounded-full bg-[var(--sidebar-active-bg)] flex items-center justify-center text-xs font-semibold text-[var(--sidebar-active-text)] flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <Link href={ROUTES.CUSTOMER_DETAIL(c.id)} className="text-xs font-semibold text-[var(--text-primary)] hover:underline block truncate">
                {c.name}
              </Link>
              <div className="flex items-center gap-1">
                {c.email ? (
                  <>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{c.email}</p>
                    {c.email_verified
                      ? <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                      : <XCircle className="h-3 w-3 text-[var(--text-muted)] flex-shrink-0" />}
                  </>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{c.phone ?? '—'}</p>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <CustomerStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'total_orders',
      accessorKey: 'total_orders',
      header: 'Orders',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-[var(--text-secondary)]">{row.original.total_orders}</span>
      ),
    },
    {
      id: 'total_spent',
      accessorKey: 'total_spent',
      header: 'Total Spent',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums">{formatPrice(row.original.total_spent)}</span>
      ),
    },
    {
      id: 'last_order_at',
      header: 'Last Order',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">
          {row.original.last_order_at ? formatTimeAgo(row.original.last_order_at) : '—'}
        </span>
      ),
    },
    {
      id: 'joined_at',
      accessorKey: 'joined_at',
      header: 'Joined',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">{formatDate(row.original.joined_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={ROUTES.CUSTOMER_DETAIL(c.id)} className="flex items-center gap-2 w-full">
                  <Eye className="h-3.5 w-3.5" /> View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {c.status === 'banned' ? (
                <DropdownMenuItem onClick={() => setConfirmAction({ customer: c, action: 'unban' })}>
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Reinstate Customer
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ customer: c, action: 'ban' })}
                  className="text-[var(--danger)] focus:text-[var(--danger)]"
                >
                  <ShieldOff className="h-3.5 w-3.5" /> Ban Customer
                </DropdownMenuItem>
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
        compact
        getRowId={(row) => row.id}
        emptyMessage="No customers found."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search name, email…" onChange={setSearch} className="w-56" />
            <Select value={filters.status ?? ''} onValueChange={(v) => setStatus(v ? v as CustomerStatus : undefined)}>
              <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 py-1 border border-[var(--border)] rounded-md transition-colors">
                Clear
              </button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
        title={confirmAction?.action === 'ban' ? `Ban ${confirmAction.customer.name}?` : `Reinstate ${confirmAction?.customer.name}?`}
        description={
          confirmAction?.action === 'ban'
            ? 'This will prevent the customer from logging in or placing orders. They will be notified.'
            : 'This will restore the customer\'s account access.'
        }
        confirmLabel={confirmAction?.action === 'ban' ? 'Ban Customer' : 'Reinstate Customer'}
        onConfirm={handleStatusChange}
        isLoading={statusMutation.isPending}
        variant={confirmAction?.action === 'ban' ? 'danger' : 'default'}
      />
    </>
  );
}
