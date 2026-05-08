'use client';

import { useState, useMemo } from 'react';
import { Shield, ShieldCheck, ShieldOff, ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRoleCatalogue } from '@/hooks/useRoleCatalogue';
import type { Role, Permission } from '@/types';

type PermissionState = 'role' | 'granted' | 'revoked';

interface PermissionEditorProps {
  role: Role;
  grantedPermissions: Permission[];
  revokedPermissions: Permission[];
  onChange: (granted: Permission[], revoked: Permission[]) => void;
}

const STATE_CONFIG: Record<PermissionState, {
  label: string;
  dot: string;
  badge: string;
  icon: React.ElementType;
}> = {
  role: {
    label: 'From role',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: ShieldCheck,
  },
  granted: {
    label: 'Extra grant',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    icon: Shield,
  },
  revoked: {
    label: 'Revoked',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    icon: ShieldOff,
  },
};

function getState(
  permission: Permission,
  rolePerms: Set<Permission>,
  granted: Set<Permission>,
  revoked: Set<Permission>
): PermissionState {
  if (revoked.has(permission)) return 'revoked';
  if (granted.has(permission)) return 'granted';
  if (rolePerms.has(permission)) return 'role';
  return 'revoked';
}

function isEffectivelyActive(state: PermissionState) {
  return state === 'role' || state === 'granted';
}

export function PermissionEditor({
  role,
  grantedPermissions,
  revokedPermissions,
  onChange,
}: PermissionEditorProps) {
  const { data: catalogue, isLoading } = useRoleCatalogue();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Role's default permissions from backend catalogue
  const rolePerms = useMemo<Set<Permission>>(() => {
    if (!catalogue) return new Set();
    const def = catalogue.roles.find((r) => r.key === role);
    return new Set((def?.permissions ?? []) as Permission[]);
  }, [catalogue, role]);

  const granted = useMemo(() => new Set(grantedPermissions), [grantedPermissions]);
  const revoked = useMemo(() => new Set(revokedPermissions), [revokedPermissions]);

  // Build group → permissions map from catalogue
  const permsByGroup = useMemo(() => {
    const map = new Map<string, Permission[]>();
    if (!catalogue) return map;
    for (const perm of catalogue.permissions) {
      if (!map.has(perm.group)) map.set(perm.group, []);
      map.get(perm.group)!.push(perm.key);
    }
    return map;
  }, [catalogue]);

  const permLabels = useMemo(() => {
    if (!catalogue) return new Map<string, string>();
    return new Map(catalogue.permissions.map((p) => [p.key, p.label]));
  }, [catalogue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading permissions…
      </div>
    );
  }

  if (!catalogue) return null;

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function togglePermission(permission: Permission) {
    const state = getState(permission, rolePerms, granted, revoked);
    const isActive = isEffectivelyActive(state);
    let newGranted = new Set(granted);
    let newRevoked = new Set(revoked);

    if (isActive) {
      if (state === 'role') {
        newRevoked.add(permission);
      } else if (state === 'granted') {
        newGranted.delete(permission);
      }
    } else {
      if (state === 'revoked' && rolePerms.has(permission)) {
        newRevoked.delete(permission);
      } else {
        newGranted.add(permission);
        newRevoked.delete(permission);
      }
    }
    onChange([...newGranted], [...newRevoked]);
  }

  const extraGranted = grantedPermissions.length;
  const totalRevoked = revokedPermissions.length;
  const effectiveCount = rolePerms.size + extraGranted - totalRevoked;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{rolePerms.size} from role</span>
        </div>
        {extraGranted > 0 && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">+{extraGranted} extra</span>
          </div>
        )}
        {totalRevoked > 0 && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">−{totalRevoked} revoked</span>
          </div>
        )}
        <span className="ml-auto text-[13px] font-semibold text-foreground">
          {effectiveCount} effective permissions
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground px-1">
        {Object.entries(STATE_CONFIG).map(([state, cfg]) => (
          <span key={state} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Permission groups — driven by backend catalogue */}
      <div className="space-y-1.5">
        {catalogue.groups.map((group) => {
          const perms = permsByGroup.get(group.key) ?? [];
          if (perms.length === 0) return null;

          const isOpen = expandedGroups.has(group.key);
          const activeInGroup = perms.filter((p) =>
            isEffectivelyActive(getState(p, rolePerms, granted, revoked))
          ).length;
          const hasOverrides = perms.some((p) => granted.has(p) || revoked.has(p));

          return (
            <div key={group.key} className="rounded-xl border border-border overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isOpen
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-[13px] font-semibold text-foreground">{group.label}</span>
                  {hasOverrides && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      customised
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {activeInGroup}/{perms.length} active
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border divide-y divide-border/50">
                  {perms.map((permission) => {
                    const state = getState(permission, rolePerms, granted, revoked);
                    const isActive = isEffectivelyActive(state);
                    const cfg = STATE_CONFIG[state];
                    const Icon = cfg.icon;
                    const label = permLabels.get(permission) ?? permission;

                    return (
                      <div
                        key={permission}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn('h-4 w-4 flex-shrink-0', {
                            'text-emerald-500': state === 'role',
                            'text-blue-500': state === 'granted',
                            'text-red-400': state === 'revoked',
                          })} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{label}</p>
                            <code className="text-[10px] text-muted-foreground font-mono">{permission}</code>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1', cfg.badge)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                            {cfg.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => togglePermission(permission)}
                            className={cn(
                              'relative w-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40',
                              isActive
                                ? state === 'granted' ? 'bg-blue-500' : 'bg-emerald-500'
                                : 'bg-border'
                            )}
                            style={{ height: '22px' }}
                            aria-checked={isActive}
                            role="switch"
                          >
                            <span
                              className={cn(
                                'absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                                isActive ? 'translate-x-[18px]' : 'translate-x-0'
                              )}
                              style={{ width: '18px', height: '18px' }}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 text-[12px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <p>
          New permissions are added by developers when new features ship — they cannot be created here.
          Permissions only work when both the frontend and backend check for them.
        </p>
      </div>
    </div>
  );
}
