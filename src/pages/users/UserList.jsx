/**
 * User List Page
 * Manage all users with Material React Table
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useGetUsersQuery, useDeleteUserMutation } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const UserList = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, isFetching } = useGetUsersQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
  });

  const [deleteUser] = useDeleteUserMutation();

  // Mock data for demo
  const mockUsers = [
    { id: '1', email: 'john@example.com', first_name: 'John', last_name: 'Doe', roles: [{ id: '1', name: 'admin', description: 'Admin role' }], is_active: true, email_verified: true, created_at: '2024-01-15' },
    { id: '2', email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith', roles: [{ id: '2', name: 'customer', description: 'Customer role' }], is_active: true, email_verified: true, created_at: '2024-01-14' },
    { id: '3', email: 'bob@example.com', first_name: 'Bob', last_name: 'Wilson', roles: [{ id: '3', name: 'production_operator', description: 'Production role' }], is_active: true, email_verified: true, created_at: '2024-01-13' },
    { id: '4', email: 'alice@example.com', first_name: 'Alice', last_name: 'Brown', roles: [{ id: '2', name: 'customer', description: 'Customer role' }], is_active: false, email_verified: true, created_at: '2024-01-12' },
    { id: '5', email: 'charlie@example.com', first_name: 'Charlie', last_name: 'Davis', roles: [{ id: '4', name: 'support_agent', description: 'Support role' }], is_active: true, email_verified: false, created_at: '2024-01-11' },
  ];

  const users = data?.users || mockUsers;
  const totalCount = data?.total || mockUsers.length;

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
      },
      {
        accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-',
        id: 'name',
        header: 'Name',
        size: 150,
      },
      {
        accessorFn: (row) => row.roles?.[0]?.name || '-',
        id: 'role',
        header: 'Role',
        size: 120,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()?.replace(/_/g, ' ')}</span>
        ),
      },
      {
        accessorFn: (row) => row.is_active ? 'active' : 'inactive',
        id: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue()).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: users,
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
          onClick={() => navigate(`${ROUTES.USERS}/${row.original.id}`)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(`${ROUTES.USERS}/${row.original.id}/edit`)}
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
        title="Users"
        description="Manage user accounts and permissions"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Users' },
        ]}
      >
        <button
          onClick={() => navigate(`${ROUTES.USERS}/create`)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </PageHeader>

      <MaterialReactTable table={table} />
    </div>
  );
};

export default UserList;
