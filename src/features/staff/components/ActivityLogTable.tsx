'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ExportButton } from '@/components/common/ExportButton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActivityLog, useStaff } from '../hooks/useStaff';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import type { ActivityLog } from '@/types';

const ACTION_COLOR: Record<string, string> = {
  update_status: 'text-blue-600 dark:text-blue-400',
  create_product: 'text-emerald-600 dark:text-emerald-400',
  issue_refund: 'text-amber-600 dark:text-amber-400',
  ban_customer: 'text-red-600 dark:text-red-400',
  update_settings: 'text-purple-600 dark:text-purple-400',
};

const ENTITY_TYPES = ['order', 'product', 'customer', 'payment', 'settings', 'coupon', 'staff'];

export function ActivityLogTable() {
  const { query, filters, setPage, setAdminId, setEntityType } = useActivityLog();
  const { data: staffData } = useStaff();
  const logs = query.data?.items ?? [];

  const columns: ColumnDef<ActivityLog, unknown>[] = [
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => {
        const l = row.original;
        const initials = l.admin_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">{l.admin_name}</p>
              <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[l.admin_role]}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className={cn('text-[13px] font-mono font-medium', ACTION_COLOR[row.original.action] ?? 'text-foreground')}>
          {row.original.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'entity',
      header: 'Entity',
      cell: ({ row }) => {
        const l = row.original;
        return (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{l.entity_type}</span>
            <p className="text-[13px] text-foreground font-medium">{l.entity_label}</p>
          </div>
        );
      },
    },
    {
      id: 'ip',
      header: 'IP',
      cell: ({ row }) => (
        <span className="text-[12px] font-mono text-muted-foreground">{row.original.ip_address}</span>
      ),
    },
    {
      id: 'timestamp',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={logs}
      isLoading={query.isLoading}
      page={filters.page}
      pageSize={20}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(r) => r.id}
      emptyMessage="No activity recorded."
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.admin_id} onValueChange={(v) => setAdminId(v ?? '')}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All admins" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All admins</SelectItem>
              {staffData?.items.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.entity_type} onValueChange={(v) => setEntityType(v ?? '')}>
            <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="All entities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All entities</SelectItem>
              {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <ExportButton
            filename="activity-log"
            getData={() => logs.map((l) => ({
              admin: l.admin_name,
              role: l.admin_role,
              action: l.action,
              entity: l.entity_label,
              entity_type: l.entity_type,
              ip: l.ip_address,
              timestamp: l.created_at,
            }))}
          />
        </div>
      }
    />
  );
}
