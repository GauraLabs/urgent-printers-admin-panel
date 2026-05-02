'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategories, useDeleteCategory, useReorderCategories } from '../hooks/useCategories';
import { ActiveBadge } from '@/components/common/StatusBadge';
import { ROUTES } from '@/lib/constants/routes';
import type { Category } from '@/lib/api/categories';

export function CategoriesTable() {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete category'); }
  }

  async function move(id: string, dir: 'up' | 'down') {
    if (!categories) return;
    const ids = categories.map((c) => c.id);
    const idx = ids.indexOf(id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === ids.length - 1) return;
    const newIds = [...ids];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [newIds[idx], newIds[swap]] = [newIds[swap], newIds[idx]];
    try {
      await reorderMutation.mutateAsync(newIds);
    } catch { toast.error('Reorder failed'); }
  }

  const columns: ColumnDef<Category, unknown>[] = [
    {
      id: 'sort',
      header: 'Order',
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => move(row.original.id, 'up')} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => move(row.original.id, 'down')} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Category',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">{row.original.name}</p>
          {row.original.description && <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{row.original.description}</p>}
        </div>
      ),
    },
    {
      id: 'slug',
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => <span className="text-xs font-mono text-[var(--text-muted)]">{row.original.slug}</span>,
    },
    {
      id: 'product_count',
      accessorKey: 'product_count',
      header: 'Products',
      cell: ({ row }) => <span className="text-xs tabular-nums text-[var(--text-secondary)]">{row.original.product_count}</span>,
    },
    {
      id: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <ActiveBadge active={row.original.is_active} />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors">
            <MoreHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href={ROUTES.CATEGORY_DETAIL(row.original.id)} className="flex items-center gap-2 w-full">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteTarget(row.original)}
              className="text-[var(--danger)] focus:text-[var(--danger)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        compact
        getRowId={(row) => row.id}
        emptyMessage="No categories yet."
        emptyAction={
          <Link href={`${ROUTES.CATEGORIES}/new`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Category
          </Link>
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description={`This will remove the category. The ${deleteTarget?.product_count ?? 0} product(s) in it will become uncategorized.`}
        confirmLabel="Delete Category"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}
