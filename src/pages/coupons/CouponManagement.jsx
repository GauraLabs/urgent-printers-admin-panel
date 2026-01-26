/**
 * Coupon Management Page
 * Create and manage discount coupons
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useGetCouponsQuery, useDeleteCouponMutation } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Copy, Ticket, Percent, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CouponManagement = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, isFetching } = useGetCouponsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
  });

  const [deleteCoupon] = useDeleteCouponMutation();

  // Mock data
  const mockCoupons = [
    { id: '1', code: 'WELCOME20', discount_type: 'percentage', discount_value: 20, usage_limit: 100, used_count: 45, min_order_amount: 500, valid_from: '2024-01-01', valid_until: '2024-03-31', is_active: true },
    { id: '2', code: 'FLAT100', discount_type: 'fixed_amount', discount_value: 100, usage_limit: 50, used_count: 50, min_order_amount: 1000, valid_from: '2024-01-01', valid_until: '2024-02-28', is_active: false },
    { id: '3', code: 'NEWYEAR25', discount_type: 'percentage', discount_value: 25, usage_limit: 200, used_count: 89, min_order_amount: 750, valid_from: '2024-01-01', valid_until: '2024-01-31', is_active: true },
    { id: '4', code: 'BULK500', discount_type: 'fixed_amount', discount_value: 500, usage_limit: null, used_count: 12, min_order_amount: 5000, valid_from: '2024-01-01', valid_until: '2024-12-31', is_active: true },
  ];

  const coupons = data?.coupons || mockCoupons;
  const totalCount = data?.total || mockCoupons.length;

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(couponId).unwrap();
        toast.success('Coupon deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete coupon');
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        size: 150,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{cell.getValue()}</span>
            <button
              onClick={() => handleCopyCode(cell.getValue())}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'discount_type',
        header: 'Discount',
        size: 150,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.discount_type === 'percentage' ? (
              <>
                <Percent className="h-4 w-4 text-green-500" />
                <span>{row.original.discount_value}% off</span>
              </>
            ) : (
              <>
                <IndianRupee className="h-4 w-4 text-green-500" />
                <span>₹{row.original.discount_value} off</span>
              </>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'min_order_amount',
        header: 'Min Order',
        size: 100,
        Cell: ({ cell }) => `₹${cell.getValue()?.toLocaleString() || 0}`,
      },
      {
        id: 'usage',
        header: 'Usage',
        size: 120,
        Cell: ({ row }) => (
          <span>
            {row.original.used_count} / {row.original.usage_limit || '∞'}
          </span>
        ),
      },
      {
        accessorKey: 'valid_until',
        header: 'Expires',
        size: 120,
        Cell: ({ cell }) => {
          const date = new Date(cell.getValue());
          const isExpired = date < new Date();
          return (
            <span className={cn(isExpired && 'text-destructive')}>
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <StatusBadge status={cell.getValue() ? 'active' : 'inactive'} />
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: coupons,
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
        title="Coupons"
        description="Create and manage discount coupons"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Coupons' },
        ]}
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Uses</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.filter(c => c.discount_type === 'percentage').length}</p>
              <p className="text-sm text-muted-foreground">% Discounts</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <IndianRupee className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.filter(c => c.discount_type === 'fixed_amount').length}</p>
              <p className="text-sm text-muted-foreground">Fixed Discounts</p>
            </div>
          </div>
        </div>
      </div>

      <MaterialReactTable table={table} />
    </div>
  );
};

export default CouponManagement;
