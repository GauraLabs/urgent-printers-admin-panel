/**
 * Order List Page
 * Manage orders with filtering and actions
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Eye, Truck, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const OrderList = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching } = useGetOrdersQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
    status: statusFilter,
  });

  const [updateStatus] = useUpdateOrderStatusMutation();

  // Mock data
  const mockOrders = [
    { id: '1', order_number: 'ORD-2024-1234', customer_name: 'Rahul Sharma', customer_email: 'rahul@example.com', total_amount: 4500, status: 'confirmed', payment_status: 'paid', created_at: '2024-01-25T10:30:00' },
    { id: '2', order_number: 'ORD-2024-1233', customer_name: 'Priya Patel', customer_email: 'priya@example.com', total_amount: 2350, status: 'processing', payment_status: 'paid', created_at: '2024-01-25T09:15:00' },
    { id: '3', order_number: 'ORD-2024-1232', customer_name: 'Amit Kumar', customer_email: 'amit@example.com', total_amount: 8900, status: 'dispatched', payment_status: 'paid', created_at: '2024-01-24T16:45:00' },
    { id: '4', order_number: 'ORD-2024-1231', customer_name: 'Sneha Gupta', customer_email: 'sneha@example.com', total_amount: 1200, status: 'delivered', payment_status: 'paid', created_at: '2024-01-24T14:20:00' },
    { id: '5', order_number: 'ORD-2024-1230', customer_name: 'Vikram Singh', customer_email: 'vikram@example.com', total_amount: 6750, status: 'pending', payment_status: 'unpaid', created_at: '2024-01-24T11:00:00' },
  ];

  const orders = data?.orders || mockOrders;
  const totalCount = data?.total || mockOrders.length;

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success('Order status updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'order_number',
        header: 'Order',
        size: 150,
        Cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.order_number}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(row.original.created_at).toLocaleDateString()}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.customer_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.customer_email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-medium">₹{cell.getValue()?.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'payment_status',
        header: 'Payment',
        size: 100,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />,
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: orders,
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
          onClick={() => navigate(`${ROUTES.ORDERS}/${row.original.id}`)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        {['confirmed', 'processing'].includes(row.original.status) && (
          <button
            onClick={() => handleStatusChange(row.original.id, 'dispatched')}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Mark as Dispatched"
          >
            <Truck className="h-4 w-4" />
          </button>
        )}
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
        title="Orders"
        description="View and manage customer orders"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Orders' },
        ]}
      >
        <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <Download className="h-4 w-4" />
          Export
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        <div className="flex gap-2">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === status.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <MaterialReactTable table={table} />
    </div>
  );
};

export default OrderList;
