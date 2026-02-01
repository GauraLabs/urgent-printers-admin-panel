/**
 * Permissions Management Page
 * Manage system permissions with CRUD operations
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  useGetAdminPermissionsQuery,
  useGetPermissionResourcesQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const PermissionsManagement = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    resource: '',
    action: '',
    description: '',
  });

  const { data, isLoading, isFetching } = useGetAdminPermissionsQuery({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    search: globalFilter,
    resource: resourceFilter === 'all' ? '' : resourceFilter,
  });

  const { data: resourcesData } = useGetPermissionResourcesQuery();
  const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation();
  const [deletePermission] = useDeletePermissionMutation();

  const permissions = data?.permissions || [];
  const totalCount = data?.total || 0;
  const resources = resourcesData || [];

  const handleCreate = async () => {
    if (!formData.resource || !formData.action || !formData.description) {
      toast.error('All fields are required');
      return;
    }

    try {
      await createPermission(formData).unwrap();
      toast.success('Permission created successfully');
      setCreateDialogOpen(false);
      setFormData({ resource: '', action: '', description: '' });
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to create permission');
    }
  };

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setFormData({
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.description) {
      toast.error('Description is required');
      return;
    }

    try {
      await updatePermission({
        id: selectedPermission.id,
        description: formData.description,
      }).unwrap();
      toast.success('Permission updated successfully');
      setEditDialogOpen(false);
      setSelectedPermission(null);
      setFormData({ resource: '', action: '', description: '' });
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to update permission');
    }
  };

  const handleDelete = async (permission) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the permission "${permission.name}"? This may affect roles using this permission.`
      )
    ) {
      return;
    }

    try {
      await deletePermission(permission.id).unwrap();
      toast.success('Permission deleted successfully');
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to delete permission');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Permission Name',
        size: 200,
        Cell: ({ cell }) => (
          <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
            {cell.getValue()}
          </code>
        ),
      },
      {
        accessorKey: 'resource',
        header: 'Resource',
        size: 120,
        Cell: ({ cell }) => (
          <span className="capitalize font-medium">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        size: 120,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue().replace(/_/g, ' ')}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: permissions,
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
          onClick={() => handleEdit(row.original)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(row.original)}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
    renderTopToolbarCustomActions: () => (
      <div className="flex items-center gap-2">
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resources.map((resource) => (
              <SelectItem key={resource} value={resource}>
                {resource}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        title="Permissions Management"
        description="Manage system permissions and access control"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Permissions' },
        ]}
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Permission
        </Button>
      </PageHeader>

      <MaterialReactTable table={table} />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Add a new permission to the system for role assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource *</Label>
              <Input
                id="resource"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value.toLowerCase() })
                }
                placeholder="e.g., product, order, user"
              />
              <p className="text-xs text-muted-foreground">
                The resource type (lowercase, e.g., product, order, user)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Input
                id="action"
                value={formData.action}
                onChange={(e) =>
                  setFormData({ ...formData, action: e.target.value.toLowerCase() })
                }
                placeholder="e.g., create, read, update, delete"
              />
              <p className="text-xs text-muted-foreground">
                The action (lowercase, e.g., create, read, update)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this permission grants..."
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                <strong>Permission Name:</strong>{' '}
                {formData.resource && formData.action
                  ? `${formData.resource}:${formData.action}`
                  : 'resource:action'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setFormData({ resource: '', action: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Permission'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update the description for this permission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm">
                <strong>Permission Name:</strong>{' '}
                <code className="rounded bg-white px-2 py-1 font-mono text-sm">
                  {selectedPermission?.name}
                </code>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Resource and action cannot be changed. Only the description can be updated.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this permission grants..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedPermission(null);
                setFormData({ resource: '', action: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Permission'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionsManagement;
