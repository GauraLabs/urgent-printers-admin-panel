import type { ThemePresetId } from '@/types';

export interface ThemePresetSwatch {
  id: ThemePresetId;
  label: string;
  primarySwatch: string;
  accentSwatch: string;
}

// Display-only copy of urgent-printers-frontend/lib/themes.ts's THEMES array —
// that file remains the storefront's actual source of truth for these hex
// values. Keep in sync if it changes; do not invent colors here.
export const THEME_PRESETS: ThemePresetSwatch[] = [
  { id: 'roseGold', label: 'Rose Gold', primarySwatch: '#A1654B', accentSwatch: '#D9A35E' },
  { id: 'gold', label: 'Royal Gold', primarySwatch: '#AD8A3C', accentSwatch: '#7A352D' },
  { id: 'emerald', label: 'Emerald Heritage', primarySwatch: '#2F6E54', accentSwatch: '#9C7530' },
  { id: 'slate', label: 'Slate Luxury', primarySwatch: '#3A332E', accentSwatch: '#C9A052' },
  { id: 'pink', label: 'Blush Pink', primarySwatch: '#D9477E', accentSwatch: '#D9A35E' },
  { id: 'plum', label: 'Orchid Plum', primarySwatch: '#8C3D7B', accentSwatch: '#E25C8C' },
];

export const DEFAULT_THEME_PRESET: ThemePresetId = 'roseGold';
