/**
 * Role Management Page
 * Comprehensive RBAC management with role CRUD and permission assignment
 */

import { useState, useMemo } from 'react';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { ROUTES } from '@/constants/routes';
import {
  Plus,
  Edit,
  Shield,
  Users,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RoleManagement = () => {
  const { data: rolesData, isLoading, refetch } = useGetRolesQuery({ includePermissions: true });
  const { data: permissionsData } = useGetPermissionsQuery();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [expandedRole, setExpandedRole] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_names: [],
  });

  const roles = rolesData?.roles || rolesData || [];
  const permissions = permissionsData?.permissions || permissionsData || [];

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach((perm) => {
      const [resource] = perm.name.split(':');
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(perm);
    });
    return groups;
  }, [permissions]);

  const toggleRole = (roleId) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permission_names: [],
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      display_name: role.display_name || role.name,
      description: role.description || '',
      permission_names: role.permissions?.map((p) => p.name) || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.display_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createRole(formData).unwrap();
      toast.success('Role created successfully');
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();

    try {
      await updateRole({
        id: editingRole.id,
        ...formData,
      }).unwrap();
      toast.success('Role updated successfully. Changes will reflect immediately for all users.');
      setIsEditDialogOpen(false);
      setEditingRole(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error('System roles cannot be deleted');
      return;
    }

    const userCount = role.user_count || 0;
    const confirmMessage =
      userCount > 0
        ? `This role is assigned to ${userCount} user(s). Are you sure you want to delete it? Users will lose this role and its permissions immediately.`
        : `Are you sure you want to delete the role "${role.display_name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteRole(role.id).unwrap();
        toast.success('Role deleted successfully. User permissions updated.');
        refetch();
      } catch (error) {
        toast.error(error?.data?.detail || 'Failed to delete role');
      }
    }
  };

  const togglePermission = (permissionName) => {
    setFormData((prev) => {
      const current = prev.permission_names || [];
      if (current.includes(permissionName)) {
        return {
          ...prev,
          permission_names: current.filter((p) => p !== permissionName),
        };
      } else {
        return {
          ...prev,
          permission_names: [...current, permissionName],
        };
      }
    });
  };

  const toggleResourcePermissions = (resource) => {
    const resourcePerms = groupedPermissions[resource]?.map((p) => p.name) || [];
    const current = formData.permission_names || [];
    const hasAll = resourcePerms.every((p) => current.includes(p));

    if (hasAll) {
      // Remove all resource permissions
      setFormData((prev) => ({
        ...prev,
        permission_names: current.filter((p) => !resourcePerms.includes(p)),
      }));
    } else {
      // Add all resource permissions
      const newPerms = [...new Set([...current, ...resourcePerms])];
      setFormData((prev) => ({
        ...prev,
        permission_names: newPerms,
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Configure access control for your team"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Users', href: ROUTES.USERS },
          { label: 'Roles' },
        ]}
      >
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </PageHeader>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Changes to roles and permissions take effect immediately for all users with that role.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Role Header */}
            <div className="flex items-center justify-between p-5">
              <button
                onClick={() => toggleRole(role.id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {role.display_name || role.name}
                    </h3>
                    {role.is_system && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {role.user_count || 0} users
                </div>
                {expandedRole === role.id ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(role)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Edit Role"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {!role.is_system && (
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete Role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Permissions */}
            {expandedRole === role.id && (
              <div className="border-t border-border bg-muted/30 p-5">
                <h4 className="mb-4 font-medium">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissions?.map((permission) => (
                    <span
                      key={permission.id || permission.name}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        permission.name === '*:*'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {permission.name === '*:*'
                        ? 'All Permissions'
                        : permission.display_name || permission.name}
                    </span>
                  )) || <p className="text-sm text-muted-foreground">No permissions assigned</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a custom role and assign permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole}>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name (Internal) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  placeholder="e.g., custom_manager"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, no spaces (underscores allowed)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="e.g., Custom Manager"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Role description"
                />
              </div>

              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-border p-3">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`resource-${resource}`}
                          checked={perms.every((p) =>
                            formData.permission_names?.includes(p.name)
                          )}
                          onChange={() => toggleResourcePermissions(resource)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label
                          htmlFor={`resource-${resource}`}
                          className="font-medium capitalize"
                        >
                          {resource}
                        </label>
                      </div>
                      <div className="ml-6 space-y-1">
                        {perms.map((perm) => (
                          <div key={perm.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`perm-${perm.name}`}
                              checked={formData.permission_names?.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                            <label
                              htmlFor={`perm-${perm.name}`}
                              className="text-sm text-muted-foreground"
                            >
                              {perm.display_name || perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.display_name}</DialogTitle>
            <DialogDescription>
              Update role permissions
              {editingRole?.is_system && (
                <Alert className="mt-2">
                  <AlertDescription>
                    This is a system role. Only permissions can be modified.
                  </AlertDescription>
                </Alert>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole}>
            <div className="space-y-4 py-4">
              {!editingRole?.is_system && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_display_name">Display Name *</Label>
                    <Input
                      id="edit_display_name"
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData({ ...formData, display_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_description">Description</Label>
                    <Input
                      id="edit_description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-border p-3">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`edit-resource-${resource}`}
                          checked={perms.every((p) =>
                            formData.permission_names?.includes(p.name)
                          )}
                          onChange={() => toggleResourcePermissions(resource)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label
                          htmlFor={`edit-resource-${resource}`}
                          className="font-medium capitalize"
                        >
                          {resource}
                        </label>
                      </div>
                      <div className="ml-6 space-y-1">
                        {perms.map((perm) => (
                          <div key={perm.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-perm-${perm.name}`}
                              checked={formData.permission_names?.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                            <label
                              htmlFor={`edit-perm-${perm.name}`}
                              className="text-sm text-muted-foreground"
                            >
                              {perm.display_name || perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
