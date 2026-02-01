/**
 * Product List Page
 * Manage products with Material React Table
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useGetProductsQuery, useDeleteProductMutation } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Eye, Package, Layers } from 'lucide-react';
import { toast } from 'sonner';

const ProductList = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
  });

  const [deleteProduct] = useDeleteProductMutation();

  const products = data?.items || [];
  const totalCount = data?.total || 0;

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId).unwrap();
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete product');
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        size: 250,
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.thumbnail_url ? (
              <img
                src={row.original.thumbnail_url}
                alt={row.original.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.category?.name || '-',
        id: 'category',
        header: 'Category',
        size: 150,
      },
      {
        accessorKey: 'base_price',
        header: 'Base Price',
        size: 120,
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        accessorFn: (row) => row.variants?.length || 0,
        id: 'variants',
        header: 'Variants',
        size: 100,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <StatusBadge status={cell.getValue() ? 'active' : 'inactive'} />
        ),
      },
      {
        accessorKey: 'is_featured',
        header: 'Featured',
        size: 100,
        Cell: ({ cell }) => (
          cell.getValue() ? (
            <span className="text-xs font-medium text-primary">Featured</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: products,
    manualPagination: true,
    manualFiltering: true,
    rowCount: totalCount,
    state: {
      pagination,
      globalFilter,
      isLoading: isLoading || isFetching,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(`${ROUTES.PRODUCTS}/${row.original.id}`)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(`${ROUTES.PRODUCTS}/${row.original.id}/variants`)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Manage Variants"
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(`${ROUTES.PRODUCTS}/${row.original.id}/edit`)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(row.original.id)}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '0.75rem',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 600,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        color: 'text.primary',
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Products' },
        ]}
      >
        <button
          onClick={() => navigate(ROUTES.PRODUCT_CREATE)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </PageHeader>

      <MaterialReactTable table={table} />
    </div>
  );
};

export default ProductList;
