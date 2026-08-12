'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus, MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { ProductStatusBadge, ProductBadgeLabel } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { ProductSummary, ProductStatus, ProductBadge } from '@/types';

export function ProductsTable() {
  const { query, filters, sorting, setSorting, setPage, setSearch, setStatus, setCategory } = useProducts();
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteProduct();
  const [deleteProduct, setDeleteProduct] = useState<ProductSummary | null>(null);

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      await deleteMutation.mutateAsync(deleteProduct.id);
      toast.success(`"${deleteProduct.name}" archived`);
      setDeleteProduct(null);
    } catch {
      toast.error('Failed to archive product');
    }
  }

  const columns: ColumnDef<ProductSummary, unknown>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Product',
      enableSorting: true,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-9 h-9 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--text-muted)]">
              {p.primary_image_url ? (
                <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <span className="text-xs">📄</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={ROUTES.PRODUCT_DETAIL(p.id)} className="text-xs font-semibold text-[var(--text-primary)] hover:underline truncate">
                  {p.name}
                </Link>
                {p.is_featured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {p.category_id ? (categories?.find((c) => c.id === p.category_id)?.name ?? `Cat #${p.category_id}`) : '—'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <ProductStatusBadge status={p.status} />
            {p.badge && p.badge !== 'none' && <ProductBadgeLabel badge={p.badge} />}
          </div>
        );
      },
    },
    {
      id: 'min_price',
      accessorKey: 'min_price',
      header: 'From',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums">{formatPrice(row.original.min_price)}</span>
      ),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-[var(--text-muted)]">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      size: 48,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${p.name}`}
              className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={ROUTES.PRODUCT_DETAIL(p.id)} className="flex items-center gap-2 w-full">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteProduct(p)}
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
        data={query.data?.items ?? []}
        isLoading={query.isLoading}
        page={filters.page}
        pageSize={filters.page_size}
        total={query.data?.total}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        compact
        getRowId={(row) => row.id}
        emptyMessage="No products found."
        emptyAction={
          <Link href={ROUTES.PRODUCT_NEW} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Link>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search products…" onChange={setSearch} className="w-52" />
            <Select value={filters.status ?? ''} onValueChange={(v) => setStatus(v ? v as ProductStatus : undefined)}>
              <SelectTrigger size="sm" className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category_id ?? ''} onValueChange={(v) => setCategory(v || undefined)}>
              <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteProduct}
        onOpenChange={(v) => !v && setDeleteProduct(null)}
        title={`Archive "${deleteProduct?.name}"?`}
        description="The product will be archived and hidden from the storefront. It can be restored by changing its status back to Active."
        confirmLabel="Archive Product"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}
