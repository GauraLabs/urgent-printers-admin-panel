'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useRoleCatalogue } from '@/hooks/useRoleCatalogue';
import { Skeleton } from '@/components/ui/skeleton';

export function RolePermissionsMatrix() {
  const { data: catalogue, isLoading } = useRoleCatalogue();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden space-y-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-none" />
        ))}
      </div>
    );
  }

  if (!catalogue) return null;

  // Build a quick lookup: roleKey → Set<permissionKey>
  const rolePermSets = Object.fromEntries(
    catalogue.roles.map((r) => [r.key, new Set(r.permissions)])
  );

  // Build a lookup: permissionKey → label
  const permLabels = Object.fromEntries(
    catalogue.permissions.map((p) => [p.key, p.label])
  );

  // Group permissions by group key
  const permsByGroup = new Map<string, string[]>();
  for (const perm of catalogue.permissions) {
    if (!permsByGroup.has(perm.group)) permsByGroup.set(perm.group, []);
    permsByGroup.get(perm.group)!.push(perm.key);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-52 sticky left-0 bg-muted/50">
              Permission
            </th>
            {catalogue.roles.map((r) => (
              <th key={r.key} className="px-3 py-3 text-center font-semibold text-foreground whitespace-nowrap">
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {catalogue.groups.map((group) => {
            const perms = permsByGroup.get(group.key) ?? [];
            if (perms.length === 0) return null;
            return (
              <>
                <tr key={`group-${group.key}`} className="border-b border-border bg-muted/20">
                  <td colSpan={catalogue.roles.length + 1} className="px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                  </td>
                </tr>
                {perms.map((perm) => (
                  <tr key={perm} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 sticky left-0 bg-card">
                      <p className="font-medium text-muted-foreground">{permLabels[perm] ?? perm}</p>
                      <code className="text-[10px] text-muted-foreground/60 font-mono">{perm}</code>
                    </td>
                    {catalogue.roles.map((r) => (
                      <td key={r.key} className="px-3 py-2 text-center">
                        {rolePermSets[r.key]?.has(perm as never)
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <XCircle className="h-4 w-4 text-border mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
