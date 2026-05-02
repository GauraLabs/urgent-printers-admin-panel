'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus, MoreHorizontal, Pencil, Trash2, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCoupons, useDeleteCoupon } from '../hooks/useCoupons';
import { CouponStatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { Coupon, CouponStatus } from '@/types';

export function CouponsTable() {
  const { data, isLoading } = useCoupons();
  const deleteMutation = useDeleteCoupon();
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [search, setSearch] = useState('');

  const items = (data?.items ?? []).filter((c) =>
    !search || c.code.toLowerCase().includes(search.toLowerCase()) || (c.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Coupon "${deleteTarget.code}" deleted`);
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete coupon'); }
  }

  const columns: ColumnDef<Coupon, unknown>[] = [
    {
      id: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)]">{row.original.code}</span>
          {row.original.description && (
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'discount',
      header: 'Discount',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)}
            {c.max_discount_amount && (
              <span className="text-[11px] text-[var(--text-muted)] font-normal ml-1">
                (max {formatPrice(c.max_discount_amount)})
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: 'min_order',
      header: 'Min. Order',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
          {row.original.min_order_amount ? formatPrice(row.original.min_order_amount) : '—'}
        </span>
      ),
    },
    {
      id: 'usage',
      header: 'Usage',
      cell: ({ row }) => {
        const c = row.original;
        const pct = c.usage_limit ? (c.usage_count / c.usage_limit) * 100 : null;
        return (
          <div className="min-w-[80px]">
            <p className="text-xs tabular-nums text-[var(--text-primary)]">
              {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ' uses'}
            </p>
            {pct !== null && (
              <div className="mt-1 h-1 w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]')} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <CouponStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'valid_until',
      header: 'Expires',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">
          {row.original.valid_until ? formatDate(row.original.valid_until) : 'Never'}
        </span>
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
                <Link href={ROUTES.COUPON_DETAIL(c.id)} className="flex items-center gap-2 w-full">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`${ROUTES.COUPON_DETAIL(c.id)}?tab=analytics`} className="flex items-center gap-2 w-full">
                  <BarChart2 className="h-3.5 w-3.5" /> Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteTarget(c)}
                className="text-[var(--danger)] focus:text-[var(--danger)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
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
        data={items}
        isLoading={isLoading}
        compact
        getRowId={(row) => row.id}
        emptyMessage="No coupons found."
        emptyAction={
          <Link href={`${ROUTES.COUPONS}/new`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            <Plus className="h-3.5 w-3.5" /> Create Coupon
          </Link>
        }
        toolbar={
          <div className="flex items-center gap-2">
            <SearchInput placeholder="Search coupon code…" onChange={setSearch} className="w-48" />
            <Link href={`${ROUTES.COUPONS}/new`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex-shrink-0">
              <Plus className="h-3.5 w-3.5" /> New Coupon
            </Link>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete coupon "${deleteTarget?.code}"?`}
        description="This will permanently delete the coupon. Any ongoing discount for existing orders will not be affected."
        confirmLabel="Delete Coupon"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}
