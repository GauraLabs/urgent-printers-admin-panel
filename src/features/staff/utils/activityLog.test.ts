import { describe, expect, it } from 'vitest';
import { normalizeActivity } from '@/lib/api/staff';
import { actionLabel, resolveActivityActor, summarizeMeta, type StaffLookup } from './activityLog';

const STAFF: StaffLookup = new Map([['7', { name: 'Priya Rao', role: 'super_admin' }]]);

describe('normalizeActivity', () => {
  it('keeps a null admin actor null instead of stringifying it', () => {
    const log = normalizeActivity({
      id: 1, actor_admin_id: null, action: 'taxonomy.applied', resource_type: 'category',
      resource_id: null, meta: {}, ip_address: null, created_at: '2026-10-11T00:00:00Z',
    });
    expect(log.actor_admin_id).toBeNull();
    expect(log.actor_customer_id).toBeNull();
    expect(log.id).toBe('1');
  });

  it('stringifies numeric actor ids', () => {
    const log = normalizeActivity({
      id: 2, actor_admin_id: 7, actor_customer_id: 9, action: 'admin.login', resource_type: 'admin_user',
      resource_id: 7, meta: {}, ip_address: null, created_at: '2026-10-11T00:00:00Z',
    });
    expect(log.actor_admin_id).toBe('7');
    expect(log.actor_customer_id).toBe('9');
    expect(log.resource_id).toBe('7');
  });
});

describe('resolveActivityActor', () => {
  it('uses the staff name and role for a known admin', () => {
    expect(resolveActivityActor({ actor_admin_id: '7', meta: {} }, STAFF))
      .toEqual({ kind: 'admin', name: 'Priya Rao', role: 'super_admin' });
  });

  it('falls back to Admin #id for an admin missing from the staff list', () => {
    expect(resolveActivityActor({ actor_admin_id: '42', meta: {} }, STAFF).name).toBe('Admin #42');
  });

  it('labels customer actions', () => {
    expect(resolveActivityActor({ actor_admin_id: null, actor_customer_id: '9', meta: {} }, STAFF))
      .toEqual({ kind: 'customer', name: 'Customer #9', role: null });
  });

  it('labels the taxonomy migration script as a readable system actor', () => {
    const r = resolveActivityActor(
      { actor_admin_id: null, meta: { actor: 'system:taxonomy_migration', source: 'taxonomy_migration' } },
      STAFF,
    );
    expect(r).toEqual({ kind: 'system', name: 'System · taxonomy migration', role: null });
  });

  it.each([
    [{}],
    [{ actor: 'cron' }],
    [{ actor: 'system:' }],
    [{ actor: 42 }],
  ])('falls back to plain System for meta %j', (meta) => {
    expect(resolveActivityActor({ actor_admin_id: null, meta }, STAFF).name).toBe('System');
  });

  it('never renders "null" for a missing admin id', () => {
    const r = resolveActivityActor({ actor_admin_id: null, actor_customer_id: null, meta: {} }, STAFF);
    expect(r.name).not.toContain('null');
  });
});

describe('actionLabel', () => {
  it('maps the taxonomy and bulk-move events', () => {
    expect(actionLabel('taxonomy.applied')).toBe('Taxonomy Applied');
    expect(actionLabel('taxonomy.rolled_back')).toBe('Taxonomy Rolled Back');
    expect(actionLabel('product.bulk_category_moved')).toBe('Products Moved (Bulk)');
  });

  it('humanises unknown actions', () => {
    expect(actionLabel('category.deleted')).toBe('category deleted');
  });
});

describe('summarizeMeta', () => {
  it('summarises a bulk move', () => {
    expect(summarizeMeta('product.bulk_category_moved', { moved_product_ids: [1, 2, 3], category_id: 12 }))
      .toBe('3 products → category #12');
    expect(summarizeMeta('product.bulk_category_moved', { moved_product_ids: [1], category_id: null }))
      .toBe('1 product → uncategorised');
  });

  it('summarises taxonomy apply and rollback counts', () => {
    expect(summarizeMeta('taxonomy.applied', {
      created_category_ids: [1, 2], updated_category_ids: [], moved_product_ids: [5, 6, 7],
    })).toBe('2 created · 3 products moved');
    expect(summarizeMeta('taxonomy.rolled_back', {
      restored_category_ids: [1], deleted_category_ids: [2, 3], restored_product_ids: [],
    })).toBe('1 restored · 2 deleted');
  });

  it('returns null for other actions', () => {
    expect(summarizeMeta('staff.updated', { changes: {} })).toBeNull();
    expect(summarizeMeta('taxonomy.applied', {})).toBeNull();
  });
});
