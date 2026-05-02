'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ActiveBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StaffForm } from './StaffForm';
import { useStaff, useDeleteStaff } from '../hooks/useStaff';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import type { AdminUser } from '@/types';

export function StaffTable() {
  const { data, isLoading } = useStaff();
  const deleteMutation = useDeleteStaff();
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete staff member'); }
  }

  const columns: ColumnDef<AdminUser, unknown>[] = [
    {
      id: 'name',
      header: 'Member',
      cell: ({ row }) => {
        const m = row.original;
        const initials = m.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{m.name}</p>
              <p className="text-[11px] text-muted-foreground">{m.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[row.original.role])}>
          {ROLE_LABELS[row.original.role]}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'last_login',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.last_login ? formatTimeAgo(row.original.last_login) : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(m)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteTarget(m)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="text-[14px] font-semibold text-foreground mb-4">
              {editing === 'new' ? 'Add Staff Member' : `Edit — ${(editing as AdminUser).name}`}
            </h3>
            <StaffForm
              member={editing === 'new' ? undefined : editing as AdminUser}
              onSuccess={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        compact
        getRowId={(r) => r.id}
        emptyMessage="No staff members yet."
        toolbar={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name}?`}
        description="Their account will be deactivated and they will lose all admin access immediately."
        confirmLabel="Remove Member"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
