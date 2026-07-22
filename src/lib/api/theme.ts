import { get, put } from './client';
import type { SiteTheme, ThemePresetId } from '@/types';

type RawSiteTheme = Omit<SiteTheme, 'id' | 'updated_by_admin_id'> & {
  id: number | string;
  updated_by_admin_id: number | string | null;
};

function normalizeSiteTheme(raw: RawSiteTheme): SiteTheme {
  return {
    ...raw,
    id: String(raw.id),
    updated_by_admin_id: raw.updated_by_admin_id === null ? null : String(raw.updated_by_admin_id),
  };
}

export async function getSiteTheme(): Promise<SiteTheme | null> {
  const raw = await get<RawSiteTheme | null>('/admin/theme');
  return raw ? normalizeSiteTheme(raw) : null;
}

export async function updateSiteTheme(presetId: ThemePresetId): Promise<SiteTheme> {
  const raw = await put<RawSiteTheme>('/admin/theme', { preset_id: presetId });
  return normalizeSiteTheme(raw);
}
