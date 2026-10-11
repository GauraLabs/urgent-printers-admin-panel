import type { ActivityLog } from '@/types';

export const ACTION_LABELS: Record<string, string> = {
  'admin.login':                 'Logged In',
  'admin.logout':                'Logged Out',
  'staff.created':               'Staff Created',
  'staff.updated':               'Staff Updated',
  'staff.deactivated':           'Staff Deactivated',
  'taxonomy.applied':            'Taxonomy Applied',
  'taxonomy.rolled_back':        'Taxonomy Rolled Back',
  'product.bulk_category_moved': 'Products Moved (Bulk)',
  'category.updated':            'Category Updated',
  'product.updated':             'Product Updated',
  'content.imported':            'Content Imported',
  'content.rolled_back':         'Content Rolled Back',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ');
}

export type ActorKind = 'admin' | 'customer' | 'system';

export interface ResolvedActor {
  kind: ActorKind;
  name: string;
  role: string | null;
}

export type StaffLookup = ReadonlyMap<string, { name: string; role: string }>;

function systemLabel(meta: Record<string, unknown> | null | undefined): string {
  const actor = meta?.actor;
  if (typeof actor !== 'string' || !actor.startsWith('system:')) return 'System';
  const suffix = actor.slice('system:'.length).replace(/[_.:-]+/g, ' ').trim();
  return suffix ? `System · ${suffix}` : 'System';
}

export function resolveActivityActor(
  log: Pick<ActivityLog, 'actor_admin_id' | 'actor_customer_id' | 'meta'>,
  staffById: StaffLookup,
): ResolvedActor {
  if (log.actor_admin_id) {
    const staff = staffById.get(log.actor_admin_id);
    return {
      kind: 'admin',
      name: staff?.name ?? `Admin #${log.actor_admin_id}`,
      role: staff?.role ?? null,
    };
  }
  if (log.actor_customer_id) {
    return { kind: 'customer', name: `Customer #${log.actor_customer_id}`, role: null };
  }
  return { kind: 'system', name: systemLabel(log.meta), role: null };
}

function countOf(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

function plural(n: number, word: string): string {
  return `${n} ${n === 1 ? word.replace(/ies$/, 'y').replace(/s$/, '') : word}`;
}

const MAX_FIELDS_SHOWN = 3;

function summarizeContentImportRow(meta: Record<string, unknown>): string {
  const label = meta.rollback === true ? 'Content rollback' : 'Content import';
  const fields = Array.isArray(meta.fields) ? meta.fields.filter((f): f is string => typeof f === 'string') : [];
  if (!fields.length) return label;
  const shown = fields.slice(0, MAX_FIELDS_SHOWN).join(', ');
  const extra = fields.length - MAX_FIELDS_SHOWN;
  return `${label} · ${shown}${extra > 0 ? ` +${extra} more` : ''}`;
}

function summarizeContentRun(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  const cats = countOf(meta.category_ids);
  const prods = countOf(meta.product_ids);
  if (cats) parts.push(plural(cats, 'categories'));
  if (prods) parts.push(plural(prods, 'products'));
  return parts.length ? `${parts.join(' · ')} updated` : 'No changes';
}

/** One-line summary for actions whose meta holds id arrays/maps that the generic key=value fallback garbles. */
export function summarizeMeta(action: string, meta: Record<string, unknown>): string | null {
  if (action === 'product.bulk_category_moved') {
    const n = countOf(meta.moved_product_ids);
    const parts: string[] = [];
    if (n != null) parts.push(`${n} product${n === 1 ? '' : 's'}`);
    parts.push(meta.category_id != null ? `→ category #${String(meta.category_id)}` : '→ uncategorised');
    return parts.join(' ');
  }
  if (action === 'content.imported' || action === 'content.rolled_back') return summarizeContentRun(meta);
  if ((action === 'category.updated' || action === 'product.updated') && meta.source === 'content_import') {
    return summarizeContentImportRow(meta);
  }
  const counts: [unknown, string][] =
    action === 'taxonomy.applied'
      ? [[meta.created_category_ids, 'created'], [meta.updated_category_ids, 'updated'], [meta.moved_product_ids, 'products moved']]
      : action === 'taxonomy.rolled_back'
        ? [[meta.restored_category_ids, 'restored'], [meta.deleted_category_ids, 'deleted'], [meta.restored_product_ids, 'products restored']]
        : [];
  const parts = counts.flatMap(([v, label]) => {
    const n = countOf(v);
    return n ? [`${n} ${label}`] : [];
  });
  return parts.length ? parts.join(' · ') : null;
}
