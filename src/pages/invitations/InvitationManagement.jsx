/**
 * Invitation Management Page
 * Manage staff invitations with Material React Table
 */

import { useMemo, useState, useCallback } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useCancelInvitationMutation,
  useDeleteInvitationMutation,
  useGetRolesQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Plus, Ban, Trash2, MailCheck } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const InvitationManagement = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role_name: '' });

  const { data, isLoading, isFetching, refetch } = useGetInvitationsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    status: statusFilter === 'all' ? '' : statusFilter,
  });

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const [createInvitation, { isLoading: isCreating }] = useCreateInvitationMutation();
  const [cancelInvitation] = useCancelInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();

  const invitations = data?.invitations || [];
  const totalCount = data?.total || 0;

  // Filter roles to exclude customer role
  const staffRoles = useMemo(() => {
    if (!rolesData) return [];
    // Handle both array response and object with roles property
    const roles = Array.isArray(rolesData) ? rolesData : rolesData.roles || [];
    return roles.filter(role => role.name !== 'customer');
  }, [rolesData]);

  const handleCreateInvitation = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.role_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createInvitation(formData).unwrap();
      toast.success('Invitation sent successfully');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', role_name: '' });
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to send invitation');
    }
  }, [formData, createInvitation, refetch]);

  const handleEmailChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
  }, []);

  const handleRoleChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, role_name: value }));
  }, []);

  const handleCancel = useCallback(async (invitationId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await cancelInvitation(invitationId).unwrap();
        toast.success('Invitation cancelled successfully');
        refetch();
      } catch (error) {
        toast.error(error?.data?.detail || 'Failed to cancel invitation');
      }
    }
  }, [cancelInvitation, refetch]);

  const handleDelete = useCallback(async (invitationId) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      try {
        await deleteInvitation(invitationId).unwrap();
        toast.success('Invitation deleted successfully');
        refetch();
      } catch (error) {
        toast.error(error?.data?.detail || 'Failed to delete invitation');
      }
    }
  }, [deleteInvitation, refetch]);

  const getStatusVariant = useCallback((status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
      },
      {
        accessorFn: (row) => row.role?.display_name || row.role?.name || '-',
        id: 'role',
        header: 'Role',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => (
          <StatusBadge
            status={cell.getValue()}
            variant={getStatusVariant(cell.getValue())}
          />
        ),
        filterFn: 'equals',
      },
      {
        accessorFn: (row) => row.invited_by?.name || '-',
        id: 'invited_by',
        header: 'Invited By',
        size: 150,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue()).toLocaleDateString(),
      },
      {
        accessorKey: 'expires_at',
        header: 'Expires',
        size: 120,
        Cell: ({ cell, row }) => {
          const expiresAt = new Date(cell.getValue());
          const isExpired = row.original.is_expired;
          return (
            <span className={isExpired ? 'text-destructive' : ''}>
              {expiresAt.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: invitations,
    manualPagination: true,
    rowCount: totalCount,
    state: {
      pagination,
      isLoading: isLoading || isFetching,
    },
    onPaginationChange: setPagination,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.status === 'pending' && (
          <button
            onClick={() => handleCancel(row.original.id)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Cancel Invitation"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
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
    renderTopToolbar: ({ table }) => (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Invitations"
        description="Invite and manage staff member access"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Invitations' },
        ]}
      >
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Invite Staff Member
        </button>
      </PageHeader>

      <MaterialReactTable table={table} />

      {/* Create Invitation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck className="h-5 w-5" />
              Invite Staff Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to onboard a new staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvitation}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role_name}
                  onValueChange={handleRoleChange}
                  required
                  disabled={rolesLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.length === 0 ? (
                      <SelectItem value="no-roles" disabled>
                        No roles available
                      </SelectItem>
                    ) : (
                      staffRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.display_name || role.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The invited user will be assigned this role upon accepting the invitation.
                  {staffRoles.length > 0 && ` (${staffRoles.length} roles available)`}
                </p>
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
                {isCreating ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvitationManagement;




// /**
//  * Invitation Management Page
//  * Manage staff invitations with Material React Table
//  */

// import React, { useMemo, useState, useCallback } from 'react';
// import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
// import {
//   useGetInvitationsQuery,
//   useCreateInvitationMutation,
//   useCancelInvitationMutation,
//   useDeleteInvitationMutation,
//   useGetRolesQuery,
// } from '@/store/api/apiSlice';
// import PageHeader from '@/components/common/PageHeader';
// import StatusBadge from '@/components/common/StatusBadge';
// import { ROUTES } from '@/constants/routes';
// import { Plus, Ban, Trash2, MailCheck } from 'lucide-react';
// import { toast } from 'sonner';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';

// /* ------------------------- TABLE WRAPPER ------------------------- */
// const InvitationTable = React.memo(function InvitationTable({ table }) {
//   return <MaterialReactTable table={table} />;
// });

// /* --------------------- CREATE DIALOG --------------------- */
// const CreateInvitationDialog = React.memo(function CreateInvitationDialog({
//   open,
//   onOpenChange,
//   staffRoles,
//   rolesLoading,
//   onSubmit,
//   isCreating,
// }) {
//   const [formData, setFormData] = useState({ email: '', role_name: '' });

//   const handleEmailChange = (e) => {
//     setFormData((prev) => ({ ...prev, email: e.target.value }));
//   };

//   const handleRoleChange = (value) => {
//     setFormData((prev) => ({ ...prev, role_name: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!formData.email || !formData.role_name) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     onSubmit(formData);
//     setFormData({ email: '', role_name: '' });
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <MailCheck className="h-5 w-5" />
//             Invite Staff Member
//           </DialogTitle>
//           <DialogDescription>
//             Send an invitation email to onboard a new staff member.
//           </DialogDescription>
//         </DialogHeader>

//         <form onSubmit={handleSubmit}>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label>Email Address *</Label>
//               <Input
//                 type="email"
//                 placeholder="user@example.com"
//                 value={formData.email}
//                 onChange={handleEmailChange}
//                 required
//                 autoComplete="off"
//               />
//             </div>

//             <div className="grid gap-2">
//               <Label>Role *</Label>
//               <Select
//                 value={formData.role_name}
//                 onValueChange={handleRoleChange}
//                 disabled={rolesLoading}
//               >
//                 <SelectTrigger>
//                   <SelectValue
//                     placeholder={rolesLoading ? 'Loading roles...' : 'Select a role'}
//                   />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {staffRoles.length === 0 ? (
//                     <SelectItem value="no-roles" disabled>
//                       No roles available
//                     </SelectItem>
//                   ) : (
//                     staffRoles.map((role) => (
//                       <SelectItem key={role.id} value={role.name}>
//                         {role.display_name || role.name}
//                       </SelectItem>
//                     ))
//                   )}
//                 </SelectContent>
//               </Select>
//               <p className="text-xs text-muted-foreground">
//                 The invited user will be assigned this role upon accepting the invitation.
//                 {staffRoles.length > 0 && ` (${staffRoles.length} roles available)`}
//               </p>
//             </div>
//           </div>

//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={isCreating}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isCreating}>
//               {isCreating ? 'Sending...' : 'Send Invitation'}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// });

// /* --------------------------- MAIN PAGE --------------------------- */

// const InvitationManagement = () => {
//   const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

//   const { data, isLoading, isFetching, refetch } = useGetInvitationsQuery({
//     page: pagination.pageIndex + 1,
//     limit: pagination.pageSize,
//     status: statusFilter === 'all' ? '' : statusFilter,
//   });

//   const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
//   const [createInvitation, { isLoading: isCreating }] =
//     useCreateInvitationMutation();
//   const [cancelInvitation] = useCancelInvitationMutation();
//   const [deleteInvitation] = useDeleteInvitationMutation();

//   const invitations = data?.invitations || [];
//   const totalCount = data?.total || 0;

//   const staffRoles = useMemo(() => {
//     if (!rolesData) return [];
//     const roles = Array.isArray(rolesData)
//       ? rolesData
//       : rolesData.roles || [];
//     return roles.filter((role) => role.name !== 'customer');
//   }, [rolesData]);

//   const handleCreate = useCallback(
//     async (payload) => {
//       try {
//         await createInvitation(payload).unwrap();
//         toast.success('Invitation sent successfully');
//         setIsCreateDialogOpen(false);
//         refetch();
//       } catch (error) {
//         toast.error(error?.data?.detail || 'Failed to send invitation');
//       }
//     },
//     [createInvitation, refetch]
//   );

//   const handleCancel = useCallback(
//     async (id) => {
//       if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
//       await cancelInvitation(id).unwrap();
//       toast.success('Invitation cancelled successfully');
//       refetch();
//     },
//     [cancelInvitation, refetch]
//   );

//   const handleDelete = useCallback(
//     async (id) => {
//       if (!window.confirm('Are you sure you want to delete this invitation?')) return;
//       await deleteInvitation(id).unwrap();
//       toast.success('Invitation deleted successfully');
//       refetch();
//     },
//     [deleteInvitation, refetch]
//   );

//   const getStatusVariant = useCallback((status) => {
//     switch (status) {
//       case 'pending':
//         return 'warning';
//       case 'accepted':
//         return 'success';
//       case 'expired':
//         return 'secondary';
//       case 'cancelled':
//         return 'destructive';
//       default:
//         return 'default';
//     }
//   }, []);

//   const columns = useMemo(
//     () => [
//       { accessorKey: 'email', header: 'Email', size: 200 },
//       {
//         accessorFn: (row) => row.role?.display_name || row.role?.name || '-',
//         id: 'role',
//         header: 'Role',
//         size: 150,
//       },
//       {
//         accessorKey: 'status',
//         header: 'Status',
//         size: 120,
//         Cell: ({ cell }) => (
//           <StatusBadge
//             status={cell.getValue()}
//             variant={getStatusVariant(cell.getValue())}
//           />
//         ),
//       },
//       {
//         accessorFn: (row) => row.invited_by?.name || '-',
//         id: 'invited_by',
//         header: 'Invited By',
//         size: 150,
//       },
//       {
//         accessorKey: 'created_at',
//         header: 'Created',
//         size: 120,
//         Cell: ({ cell }) => new Date(cell.getValue()).toLocaleDateString(),
//       },
//       {
//         accessorKey: 'expires_at',
//         header: 'Expires',
//         size: 120,
//         Cell: ({ cell, row }) => {
//           const expiresAt = new Date(cell.getValue());
//           const isExpired = row.original.is_expired;
//           return (
//             <span className={isExpired ? 'text-destructive' : ''}>
//               {expiresAt.toLocaleDateString()}
//             </span>
//           );
//         },
//       },
//     ],
//     [getStatusVariant]
//   );

//   const table = useMaterialReactTable({
//     columns,
//     data: invitations,
//     manualPagination: true,
//     rowCount: totalCount,
//     state: { pagination, isLoading: isLoading || isFetching },
//     onPaginationChange: setPagination,
//     enableRowActions: true,
//     positionActionsColumn: 'last',
//     renderRowActions: ({ row }) => (
//       <div className="flex items-center gap-1">
//         {row.original.status === 'pending' && (
//           <button
//             onClick={() => handleCancel(row.original.id)}
//             className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
//           >
//             <Ban className="h-4 w-4" />
//           </button>
//         )}
//         <button
//           onClick={() => handleDelete(row.original.id)}
//           className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
//         >
//           <Trash2 className="h-4 w-4" />
//         </button>
//       </div>
//     ),
//     renderTopToolbar: ({ table }) => (
//       <div className="flex items-center p-4">
//         <Select value={statusFilter} onValueChange={setStatusFilter}>
//           <SelectTrigger className="w-[180px]">
//             <SelectValue placeholder="All Statuses" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Statuses</SelectItem>
//             <SelectItem value="pending">Pending</SelectItem>
//             <SelectItem value="accepted">Accepted</SelectItem>
//             <SelectItem value="expired">Expired</SelectItem>
//             <SelectItem value="cancelled">Cancelled</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//     ),
//   });

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Staff Invitations"
//         description="Invite and manage staff member access"
//         breadcrumbs={[
//           { label: 'Dashboard', href: ROUTES.DASHBOARD },
//           { label: 'Invitations' },
//         ]}
//       >
//         <button
//           onClick={() => setIsCreateDialogOpen(true)}
//           className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
//         >
//           <Plus className="h-4 w-4" />
//           Invite Staff Member
//         </button>
//       </PageHeader>

//       <InvitationTable table={table} />

//       <CreateInvitationDialog
//         open={isCreateDialogOpen}
//         onOpenChange={setIsCreateDialogOpen}
//         staffRoles={staffRoles}
//         rolesLoading={rolesLoading}
//         onSubmit={handleCreate}
//         isCreating={isCreating}
//       />
//     </div>
//   );
// };

// export default InvitationManagement;
