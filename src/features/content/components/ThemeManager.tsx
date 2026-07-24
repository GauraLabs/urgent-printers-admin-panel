'use client';

import { useState } from 'react';
import { Check, Info, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { useSiteTheme, useSiteThemeMutation } from '../hooks/useContent';
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from '@/lib/constants/themePresets';
import type { ThemePresetId } from '@/types';

export function ThemeManager() {
  const { canManageContent } = usePermissions();
  const { data: theme, isLoading } = useSiteTheme();
  const mutation = useSiteThemeMutation();

  const [selected, setSelected] = useState<ThemePresetId>(DEFAULT_THEME_PRESET);
  const [syncedPresetId, setSyncedPresetId] = useState<ThemePresetId | null>(null);

  // Adjust local selection during render when fresh server data arrives —
  // avoids a useEffect+setState cascade (see react-hooks/set-state-in-effect).
  if (theme && theme.preset_id !== syncedPresetId) {
    setSyncedPresetId(theme.preset_id);
    setSelected(theme.preset_id);
  }

  if (isLoading) return <LoadingSkeleton rows={3} className="max-w-xl" />;

  const activePreset = theme?.preset_id ?? DEFAULT_THEME_PRESET;
  const isDirty = selected !== activePreset;

  async function handleSave() {
    if (!canManageContent || !isDirty) return;
    try {
      await mutation.mutateAsync(selected);
      toast.success('Site theme updated');
    } catch {
      toast.error('Failed to update site theme');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {!canManageContent && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Content. The &ldquo;Manage Content&rdquo; permission is required to change the site theme.</p>
        </div>
      )}

      <fieldset disabled={!canManageContent} className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-primary)]">Brand color preset</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = selected === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={!canManageContent}
                onClick={() => setSelected(preset.id)}
                aria-pressed={isActive}
                className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? 'border-[var(--primary)] ring-2 ring-[var(--ring)]'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                <span
                  className="h-10 w-10 rounded-full border border-[var(--border)]"
                  style={{ background: `linear-gradient(135deg, ${preset.primarySwatch} 50%, ${preset.accentSwatch} 50%)` }}
                />
                <span className="text-xs font-medium text-[var(--text-primary)]">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Button type="button" onClick={handleSave} disabled={!canManageContent || !isDirty || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save Theme'}
        </Button>
        <p className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
          Changes go live across the entire site within seconds — the storefront updates instantly, no cache delay.
        </p>
      </div>
    </div>
  );
}
