'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
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
import { buildTreeRows, reorderWithinSiblings, visibleRows, type TreeRow } from '../utils/categoryTree';

type Row = TreeRow<Category>;

export function CategoriesTable() {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const rows = useMemo(
    () => visibleRows(buildTreeRows(categories ?? []), collapsed),
    [categories, collapsed],
  );

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      if ((err as { status?: number } | undefined)?.status === 409) {
        toast.error(`"${deleteTarget.name}" still has subcategories. Move or delete its subcategories first.`);
        setDeleteTarget(null);
      } else {
        toast.error('Failed to delete category');
      }
    }
  }

  async function move(id: string, dir: 'up' | 'down') {
    if (!categories) return;
    const newIds = reorderWithinSiblings(categories, id, dir);
    if (!newIds) return;
    try {
      await reorderMutation.mutateAsync(newIds);
    } catch { toast.error('Reorder failed'); }
  }

  const columns: ColumnDef<Row, unknown>[] = [
    {
      id: 'sort',
      header: 'Order',
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button aria-label={`Move ${row.original.name} up`} onClick={() => move(row.original.id, 'up')} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button aria-label={`Move ${row.original.name} down`} onClick={() => move(row.original.id, 'down')} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Category',
      cell: ({ row }) => {
        const c = row.original;
        const thumbUrl = c.images?.[0]?.thumb;
        return (
          <div className="flex items-center gap-3 min-w-[180px]" style={{ paddingLeft: c.depth * 24 }} data-depth={c.depth}>
            {c.hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(c.id)}
                aria-label={`${collapsed.has(c.id) ? 'Expand' : 'Collapse'} ${c.name}`}
                aria-expanded={!collapsed.has(c.id)}
                className="p-0.5 -mr-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)]"
              >
                {collapsed.has(c.id) ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-[18px] -mr-1.5 flex-shrink-0" aria-hidden />
            )}
            <div className="w-9 h-9 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] overflow-hidden">
              {thumbUrl ? (
                <img src={thumbUrl} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">📁</span>
              )}
            </div>
            <div className="min-w-0">
              <Link href={ROUTES.CATEGORY_DETAIL(c.id)} className="block text-xs font-semibold text-[var(--text-primary)] hover:underline truncate">
                {c.name}
              </Link>
              {c.description && <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{c.description}</p>}
            </div>
          </div>
        );
      },
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
      cell: ({ row }) => {
        const c = row.original;
        return (
          <span className="text-xs tabular-nums text-[var(--text-secondary)]" title="Products directly in this category, and including subcategories">
            {c.product_count}
            {c.hasChildren && <span className="text-[var(--text-muted)]"> · {c.total_product_count} total</span>}
          </span>
        );
      },
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
          <DropdownMenuTrigger
            aria-label={`Actions for ${row.original.name}`}
            className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors"
          >
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
              onClick={() => setDeleteTarget(row.original)}
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
        data={rows}
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
        description={
          deleteTarget?.children_count
            ? `"${deleteTarget.name}" has ${deleteTarget.children_count} subcategor${deleteTarget.children_count === 1 ? 'y' : 'ies'}. Move or delete its subcategories first, otherwise the delete will be rejected.`
            : `This will remove the category. The ${deleteTarget?.product_count ?? 0} product(s) in it will become uncategorized.`
        }
        confirmLabel="Delete Category"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}
