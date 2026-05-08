'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { LogIn, LogOut, UserPlus, UserCog, UserX, FileEdit, Activity as ActivityIcon } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { ExportButton } from '@/components/common/ExportButton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActivityLog, useStaff } from '../hooks/useStaff';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import type { ActivityLog } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  'admin.login':       'Logged In',
  'admin.logout':      'Logged Out',
  'staff.created':     'Staff Created',
  'staff.updated':     'Staff Updated',
  'staff.deactivated': 'Staff Deactivated',
};

const ACTION_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  'admin.login':       { icon: LogIn,      cls: 'text-emerald-600 dark:text-emerald-400' },
  'admin.logout':      { icon: LogOut,     cls: 'text-muted-foreground' },
  'staff.created':     { icon: UserPlus,   cls: 'text-blue-600 dark:text-blue-400' },
  'staff.updated':     { icon: FileEdit,   cls: 'text-amber-600 dark:text-amber-400' },
  'staff.deactivated': { icon: UserX,      cls: 'text-red-600 dark:text-red-400' },
};

const RESOURCE_TYPES = ['admin_user'];

/** Human-readable rendering of the meta JSON. */
function renderMeta(action: string, meta: Record<string, unknown>): React.ReactNode {
  if (!meta || Object.keys(meta).length === 0) return null;

  // staff.updated → { changes: { field: { from, to } } }
  if (action === 'staff.updated' && meta.changes && typeof meta.changes === 'object') {
    const changes = meta.changes as Record<string, { from: unknown; to: unknown }>;
    const entries = Object.entries(changes).slice(0, 2);
    return (
      <div className="space-y-0.5">
        {entries.map(([field, change]) => (
          <p key={field} className="text-[11px] text-muted-foreground">
            <span className="font-mono">{field}:</span>{' '}
            <span className="text-red-600 dark:text-red-400 line-through">{String(change.from)}</span>
            {' → '}
            <span className="text-emerald-600 dark:text-emerald-400">{String(change.to)}</span>
          </p>
        ))}
        {Object.keys(changes).length > 2 && (
          <p className="text-[11px] text-muted-foreground">+{Object.keys(changes).length - 2} more</p>
        )}
      </div>
    );
  }

  // staff.created → { email, role }
  if (action === 'staff.created' || action === 'staff.deactivated') {
    return (
      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
        {meta.email ? <span className="font-mono">{String(meta.email)}</span> : null}
        {meta.role ? <span> · {String(meta.role)}</span> : null}
      </p>
    );
  }

  // Fallback — compact key=value
  return (
    <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
      {Object.entries(meta).slice(0, 2).map(([k, v]) => `${k}=${String(v)}`).join(' · ')}
    </p>
  );
}

export function ActivityLogTable() {
  const { query, filters, setPage, setActorAdminId, setResourceType, setAction } = useActivityLog();
  const { query: staffQuery } = useStaff();
  const logs = query.data?.items ?? [];

  // Lookup map for actor name/role from the staff list
  const staffById = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    for (const m of staffQuery.data?.items ?? []) {
      map.set(m.id, { name: m.name, role: m.role });
    }
    return map;
  }, [staffQuery.data]);

  const columns: ColumnDef<ActivityLog, unknown>[] = [
    {
      id: 'actor',
      header: 'Actor',
      cell: ({ row }) => {
        const actor = staffById.get(row.original.actor_admin_id);
        const name = actor?.name ?? `Admin #${row.original.actor_admin_id}`;
        const role = actor?.role;
        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">{name}</p>
              <p className="text-[11px] text-muted-foreground">
                {role ? ROLE_LABELS[role as keyof typeof ROLE_LABELS] : '—'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const cfg = ACTION_ICON[row.original.action];
        const Icon = cfg?.icon ?? ActivityIcon;
        const label = ACTION_LABELS[row.original.action] ?? row.original.action.replace(/[._]/g, ' ');
        return (
          <div className="flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', cfg?.cls ?? 'text-muted-foreground')} />
            <span className="text-[13px] font-medium text-foreground">{label}</span>
          </div>
        );
      },
    },
    {
      id: 'resource',
      header: 'Resource',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div>
            <p className="text-[12px] font-mono text-muted-foreground">
              {r.resource_type}{r.resource_id ? ` #${r.resource_id}` : ''}
            </p>
            {renderMeta(r.action, r.meta)}
          </div>
        );
      },
    },
    {
      id: 'ip',
      header: 'IP',
      cell: ({ row }) => (
        <span className="text-[12px] font-mono text-muted-foreground">
          {row.original.ip_address ?? '—'}
        </span>
      ),
    },
    {
      id: 'timestamp',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={logs}
      isLoading={query.isLoading}
      page={filters.page}
      pageSize={filters.pageSize}
      total={query.data?.total}
      onPageChange={setPage}
      compact
      getRowId={(r) => r.id}
      emptyMessage="No activity recorded yet."
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.actor_admin_id} onValueChange={(v) => setActorAdminId(v ?? '')}>
            <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="All admins" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All admins</SelectItem>
              {staffQuery.data?.items.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.resource_type} onValueChange={(v) => setResourceType(v ?? '')}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="All resources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All resources</SelectItem>
              {RESOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.action} onValueChange={(v) => setAction(v ?? '')}>
            <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ExportButton
            filename="activity-log"
            getData={() => logs.map((l) => {
              const actor = staffById.get(l.actor_admin_id);
              return {
                actor: actor?.name ?? `Admin #${l.actor_admin_id}`,
                role: actor?.role ?? '',
                action: l.action,
                resource: `${l.resource_type}${l.resource_id ? ` #${l.resource_id}` : ''}`,
                ip: l.ip_address ?? '',
                timestamp: l.created_at,
              };
            })}
          />
        </div>
      }
    />
  );
}
