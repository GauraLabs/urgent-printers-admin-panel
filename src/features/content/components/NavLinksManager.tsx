'use client';

import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NavLinkForm, type NavLinkFormValues } from './NavLinkForm';
import { useNavLinks, useNavLinkMutations } from '../hooks/useContent';
import { usePermissions } from '@/hooks/usePermissions';
import type { ApiError, NavLink } from '@/types';

type Placement = 'header' | 'footer';

const PLACEMENT_LABEL: Record<Placement, string> = { header: 'Header', footer: 'Footer' };

function NavLinkTargetSummary({ link }: { link: NavLink }) {
  if (link.category_id) {
    return <p className="text-[11px] text-[var(--primary)] truncate">Category: {link.category_name ?? link.category_id}</p>;
  }
  return <p className="text-[11px] text-[var(--primary)] truncate">{link.custom_url}</p>;
}

function PlacementLinksList({ placement }: { placement: Placement }) {
  const { canManageContent } = usePermissions();
  const { data: navLinks, isLoading } = useNavLinks(placement);
  const { create, update, remove, reorder } = useNavLinkMutations(placement);
  const [editing, setEditing] = useState<NavLink | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NavLink | null>(null);

  async function move(id: string, dir: 'up' | 'down') {
    if (!canManageContent || !navLinks) return;
    const ids = navLinks.map((l) => l.id);
    const idx = ids.indexOf(id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === ids.length - 1) return;
    const next = [...ids];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    try { await reorder.mutateAsync(next); } catch { toast.error('Reorder failed'); }
  }

  async function handleSubmit(values: NavLinkFormValues) {
    const payload = { ...values, placement };
    try {
      if (editing === 'new') {
        await create.mutateAsync(payload);
        toast.success('Nav link created');
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, d: payload });
        toast.success('Nav link updated');
      }
      setEditing(null);
    } catch { toast.error('Failed to save nav link'); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success('Nav link deleted');
      setDeleteTarget(null);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        toast.error(apiErr.message || "Can't delete the last active link in this placement");
      } else {
        toast.error('Failed to delete nav link');
      }
    }
  }

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      {!canManageContent && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Content. The &ldquo;Manage Content&rdquo; permission is required to add, edit, delete, or reorder navigation links.</p>
        </div>
      )}

      {(!navLinks?.length && !editing) && (
        <div className="text-center py-10 text-sm text-[var(--text-muted)]">
          No {PLACEMENT_LABEL[placement].toLowerCase()} links yet. Create your first link.
        </div>
      )}

      <ul className="space-y-3">
        {navLinks?.map((link) => (
          <li key={link.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            {editing && editing !== 'new' && editing.id === link.id && canManageContent ? (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Editing: {link.label}</h3>
                <NavLinkForm navLink={link} onSubmit={handleSubmit} onCancel={() => setEditing(null)} isLoading={update.isPending} />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3">
                {canManageContent && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => move(link.id, 'up')} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => move(link.id, 'down')} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{link.label}</p>
                    <ActiveBadge active={link.is_active} />
                  </div>
                  <NavLinkTargetSummary link={link} />
                </div>

                {canManageContent && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(link)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(link)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === 'new' && canManageContent && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">New {PLACEMENT_LABEL[placement]} Link</h3>
          <NavLinkForm onSubmit={handleSubmit} onCancel={() => setEditing(null)} isLoading={create.isPending} />
        </div>
      )}

      {editing !== 'new' && canManageContent && (
        <Button variant="outline" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add Link
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.label}"?`}
        description="This link will be removed from the site navigation immediately."
        confirmLabel="Delete Link"
        onConfirm={handleDelete}
        isLoading={remove.isPending}
        variant="danger"
      />
    </div>
  );
}

export function NavLinksManager() {
  const [placement, setPlacement] = useState<Placement>('header');

  return (
    <Tabs value={placement} onValueChange={(v) => { if (v) setPlacement(v as Placement); }}>
      <TabsList>
        <TabsTrigger value="header">Header</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
      </TabsList>
      <TabsContent value="header" className="mt-4 outline-none">
        <PlacementLinksList placement="header" />
      </TabsContent>
      <TabsContent value="footer" className="mt-4 outline-none">
        <PlacementLinksList placement="footer" />
      </TabsContent>
    </Tabs>
  );
}
