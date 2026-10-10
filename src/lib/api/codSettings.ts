import { get, put } from './client';

export interface CodSettings {
  id: string | null;
  is_enabled: boolean;
  min_order_amount: number | null;
  max_order_amount: number | null;
  updated_by_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type RawCodSettings = Omit<CodSettings, 'id' | 'updated_by_admin_id'> & {
  id: number | string | null;
  updated_by_admin_id: number | string | null;
};

export interface UpdateCodSettingsPayload {
  is_enabled: boolean;
  min_order_amount: number | null;
  max_order_amount: number | null;
}

function normalizeCod(raw: RawCodSettings): CodSettings {
  return {
    ...raw,
    id: raw.id === null ? null : String(raw.id),
    updated_by_admin_id: raw.updated_by_admin_id === null ? null : String(raw.updated_by_admin_id),
  };
}

export async function getCodSettings(): Promise<CodSettings> {
  return normalizeCod(await get<RawCodSettings>('/admin/settings/cod'));
}

export async function updateCodSettings(payload: UpdateCodSettingsPayload): Promise<CodSettings> {
  return normalizeCod(await put<RawCodSettings>('/admin/settings/cod', payload));
}

export interface CodAmountsInput {
  min: string;
  max: string;
}

export interface CodAmountsResult {
  min: number | null;
  max: number | null;
  minError?: string;
  maxError?: string;
}

function parseAmount(raw: string, label: string): { value: number | null; error?: string } {
  const text = raw.trim();
  if (text === '') return { value: null };
  const n = Number(text);
  if (!Number.isFinite(n)) return { value: null, error: `${label} must be a number` };
  if (n < 0) return { value: null, error: `${label} cannot be negative` };
  return { value: n };
}

export function parseCodAmounts({ min, max }: CodAmountsInput): CodAmountsResult {
  const a = parseAmount(min, 'Minimum order amount');
  const b = parseAmount(max, 'Maximum order amount');
  const result: CodAmountsResult = { min: a.value, max: b.value, minError: a.error, maxError: b.error };
  if (!a.error && !b.error && a.value !== null && b.value !== null && a.value > b.value) {
    result.minError = 'Minimum order amount cannot be greater than the maximum';
  }
  return result;
}
