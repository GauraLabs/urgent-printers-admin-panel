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

describe('content import events', () => {
  it('labels the import, rollback and row-level update events', () => {
    expect(actionLabel('content.imported')).toBe('Content Imported');
    expect(actionLabel('content.rolled_back')).toBe('Content Rolled Back');
    expect(actionLabel('category.updated')).toBe('Category Updated');
    expect(actionLabel('product.updated')).toBe('Product Updated');
  });

  it('labels the content import script as a system actor', () => {
    const r = resolveActivityActor(
      { actor_admin_id: null, meta: { actor: 'system:content_import', source: 'content_import' } },
      STAFF,
    );
    expect(r).toEqual({ kind: 'system', name: 'System · content import', role: null });
  });

  it('summarises an import run as counts, not id arrays', () => {
    const meta = {
      source: 'content_import', input_sha256: 'abc',
      category_ids: [1, 2, 3, 4, 5, 6, 7, 8], product_ids: Array.from({ length: 39 }, (_, i) => i + 1),
      fields_changed: 120,
    };
    expect(summarizeMeta('content.imported', meta)).toBe('8 categories · 39 products updated');
  });

  it('summarises a rollback and singularises counts of one', () => {
    expect(summarizeMeta('content.rolled_back', {
      source: 'content_import', snapshot_taken_at: '2026-10-11T00:00:00Z', category_ids: [4], product_ids: [9],
    })).toBe('1 category · 1 product updated');
    expect(summarizeMeta('content.imported', { category_ids: [], product_ids: [1, 2] })).toBe('2 products updated');
  });

  it('reports no changes when both id lists are empty or missing', () => {
    expect(summarizeMeta('content.imported', { category_ids: [], product_ids: [] })).toBe('No changes');
    expect(summarizeMeta('content.rolled_back', {})).toBe('No changes');
  });

  it('summarises a content-import row update with its changed fields', () => {
    expect(summarizeMeta('category.updated', {
      source: 'content_import', name: 'Wedding Cards', fields: ['seo.title', 'description'],
    })).toBe('Content import · seo.title, description');
    expect(summarizeMeta('product.updated', {
      source: 'content_import', actor: 'system:content_import', name: 'Card', fields: ['description'], rollback: true,
    })).toBe('Content rollback · description');
  });

  it('caps the field list and handles missing fields', () => {
    expect(summarizeMeta('product.updated', {
      source: 'content_import', fields: ['a', 'b', 'c', 'd', 'e'],
    })).toBe('Content import · a, b, c +2 more');
    expect(summarizeMeta('category.updated', { source: 'content_import', fields: 'oops' })).toBe('Content import');
  });

  it('leaves ordinary admin updates to the generic renderer', () => {
    expect(summarizeMeta('category.updated', { name: 'Wedding Cards' })).toBeNull();
    expect(summarizeMeta('product.updated', { name: 'Card', status: 'active', pricing_changed: false })).toBeNull();
  });
});
