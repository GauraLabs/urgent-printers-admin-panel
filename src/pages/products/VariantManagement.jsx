/**
 * Variant Management Component
 * Manage product variants with create, update, delete operations
 */

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  useGetProductVariantsQuery,
  useDeleteProductVariantMutation,
  useSetDefaultVariantMutation,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Star, Package } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import VariantForm from '@/components/products/VariantForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VariantManagement = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const { data: variants, isLoading } = useGetProductVariantsQuery(productId);
  const [deleteVariant] = useDeleteProductVariantMutation();
  const [setDefaultVariant] = useSetDefaultVariantMutation();

  const handleDelete = async (variantId) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        await deleteVariant({ productId, variantId }).unwrap();
        toast.success('Variant deleted successfully');
      } catch (error) {
        toast.error(error.data?.detail || 'Failed to delete variant');
      }
    }
  };

  const handleSetDefault = async (variantId) => {
    try {
      await setDefaultVariant({ productId, variantId }).unwrap();
      toast.success('Default variant updated');
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to set default variant');
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingVariant(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVariant(null);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Variant',
        size: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{row.original.name}</p>
                {row.original.is_default && (
                  <Star className="h-3 w-3 fill-primary text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'size',
        header: 'Size',
        size: 100,
      },
      {
        accessorKey: 'material',
        header: 'Material',
        size: 120,
      },
      {
        accessorKey: 'finish',
        header: 'Finish',
        size: 100,
      },
      {
        accessorFn: (row) => `${row.min_quantity || 1} - ${row.max_quantity || '∞'}`,
        id: 'quantity_range',
        header: 'Qty Range',
        size: 120,
      },
      {
        accessorKey: 'base_price',
        header: 'Base Price',
        size: 120,
        Cell: ({ cell }) =>
          `₹${Number(cell.getValue() || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      {
        accessorKey: 'price_per_unit',
        header: 'Per Unit',
        size: 120,
        Cell: ({ cell }) =>
          cell.getValue()
            ? `₹${Number(cell.getValue()).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : '-',
      },
      {
        accessorKey: 'gst_rate',
        header: 'GST',
        size: 80,
        Cell: ({ cell }) => `${cell.getValue() || 0}%`,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 80,
        Cell: ({ cell }) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              cell.getValue()
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {cell.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: variants || [],
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-1">
        {!row.original.is_default && (
          <button
            onClick={() => handleSetDefault(row.original.id)}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Set as default"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => handleEdit(row.original)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(row.original.id)}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
          disabled={row.original.is_default}
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
    state: {
      isLoading,
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Variants"
        description="Manage variants for this product"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Products', href: ROUTES.PRODUCTS },
          { label: 'Variants' },
        ]}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PRODUCTS)}
          >
            Back to Products
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </div>
      </PageHeader>

      <MaterialReactTable table={table} />

      {/* Variant Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Edit Variant' : 'Create Variant'}
            </DialogTitle>
          </DialogHeader>
          <VariantForm
            productId={productId}
            variant={editingVariant}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VariantManagement;
