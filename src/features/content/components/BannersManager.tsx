'use client';

import { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { BannerForm, type BannerFormValues } from './BannerForm';
import { useBanners, useBannerMutations } from '../hooks/useContent';
import { cn } from '@/lib/utils/cn';
import type { Banner } from '@/types';

export function BannersManager() {
  const { data: banners, isLoading } = useBanners();
  const { create, update, remove, reorder } = useBannerMutations();
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  async function move(id: string, dir: 'up' | 'down') {
    if (!banners) return;
    const ids = banners.map((b) => b.id);
    const idx = ids.indexOf(id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === ids.length - 1) return;
    const next = [...ids];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    try { await reorder.mutateAsync(next); } catch { toast.error('Reorder failed'); }
  }

  async function handleSubmit(values: BannerFormValues) {
    try {
      if (editing === 'new') {
        await create.mutateAsync(values);
        toast.success('Banner created');
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, d: values });
        toast.success('Banner updated');
      }
      setEditing(null);
    } catch { toast.error('Failed to save banner'); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success('Banner deleted');
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete banner'); }
  }

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      {/* Banner list */}
      {(!banners?.length && !editing) && (
        <div className="text-center py-10 text-sm text-[var(--text-muted)]">No banners yet. Create your first banner.</div>
      )}

      <ul className="space-y-3">
        {banners?.map((banner, idx) => (
          <li key={banner.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            {editing && editing !== 'new' && editing.id === banner.id ? (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Editing: {banner.title}</h3>
                <BannerForm banner={banner} onSubmit={handleSubmit} onCancel={() => setEditing(null)} isLoading={update.isPending} />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => move(banner.id, 'up')} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(banner.id, 'down')} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Image preview */}
                <div className="w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'; }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{banner.title}</p>
                    <ActiveBadge active={banner.is_active} />
                  </div>
                  {banner.subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{banner.subtitle}</p>}
                  {banner.link_url && <p className="text-[11px] text-[var(--primary)] truncate">{banner.link_url}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(banner)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(banner)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* New banner form */}
      {editing === 'new' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">New Banner</h3>
          <BannerForm onSubmit={handleSubmit} onCancel={() => setEditing(null)} isLoading={create.isPending} />
        </div>
      )}

      {editing !== 'new' && (
        <Button variant="outline" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This banner will be removed from the site immediately."
        confirmLabel="Delete Banner"
        onConfirm={handleDelete}
        isLoading={remove.isPending}
        variant="danger"
      />
    </div>
  );
}
