import { describe, expect, it } from 'vitest';
import type { Category } from '@/lib/api/categories';
import {
  buildCategoryPayload, buildTreeRows, categoryOptions, categoryPath, eligibleParents,
  moveItem, reorderWithinSiblings, siblingIds, validateFaqs, visibleRows,
  type CategoryFormShape,
} from './categoryTree';

function cat(id: string, name: string, parent_id: string | null, sort_order: number): Category {
  return { id, name, parent_id, sort_order } as Category;
}

const CATS = [
  cat('1', 'Birthday', null, 3),
  cat('2', 'Wedding', null, 1),
  cat('4', 'Essentials', '2', 2),
  cat('5', 'Shagun', '2', 1),
  cat('6', 'Tags', '2', 3),
  cat('3', 'Anniversary', null, 2),
];

describe('buildTreeRows', () => {
  it('orders parent before children, siblings by sort_order, with depth', () => {
    const rows = buildTreeRows(CATS);
    expect(rows.map((r) => `${'-'.repeat(r.depth)}${r.name}`)).toEqual([
      'Wedding', '-Shagun', '-Essentials', '-Tags', 'Anniversary', 'Birthday',
    ]);
    expect(rows[0].hasChildren).toBe(true);
    expect(rows[1].hasChildren).toBe(false);
  });

  it('treats a category with a missing parent as top-level', () => {
    const rows = buildTreeRows([cat('9', 'Orphan', '404', 1)]);
    expect(rows[0].depth).toBe(0);
  });
});

describe('visibleRows', () => {
  it('hides descendants of collapsed rows only', () => {
    const rows = buildTreeRows(CATS);
    expect(visibleRows(rows, new Set(['2'])).map((r) => r.id)).toEqual(['2', '3', '1']);
    expect(visibleRows(rows, new Set()).length).toBe(6);
  });
});

describe('eligibleParents', () => {
  it('offers only top-level categories, excluding self', () => {
    const res = eligibleParents(CATS, '3');
    expect(res.options.map((c) => c.id)).toEqual(['2', '1']);
    expect(res.disabled).toBe(false);
  });
  it('excludes children from the options (depth cap)', () => {
    expect(eligibleParents(CATS).options.some((c) => c.id === '4')).toBe(false);
  });
  it('is disabled when the category itself has children', () => {
    const res = eligibleParents(CATS, '2');
    expect(res.disabled).toBe(true);
    expect(res.options).toEqual([]);
    expect(res.reason).toMatch(/subcategories/);
  });
});

describe('paths and options', () => {
  it('builds Parent > Child paths', () => {
    expect(categoryPath(CATS, '4')).toBe('Wedding > Essentials');
    expect(categoryPath(CATS, '1')).toBe('Birthday');
    expect(categoryPath(CATS, null)).toBe('');
  });
  it('lists options in tree order with hasChildren', () => {
    const opts = categoryOptions(CATS);
    expect(opts[0]).toMatchObject({ id: '2', label: 'Wedding', hasChildren: true });
    expect(opts[1]).toMatchObject({ id: '5', label: 'Wedding > Shagun', depth: 1 });
  });
});

describe('sibling-scoped reorder', () => {
  it('scopes siblings to the same parent', () => {
    expect(siblingIds(CATS, '4')).toEqual(['5', '4', '6']);
    expect(siblingIds(CATS, '1')).toEqual(['2', '3', '1']);
  });
  it('swaps within children of one parent without touching others', () => {
    expect(reorderWithinSiblings(CATS, '4', 'up')).toEqual(['4', '5', '6']);
  });
  it('works across two parents', () => {
    const two = [
      cat('a', 'A', null, 1), cat('b', 'B', null, 2),
      cat('a1', 'A1', 'a', 1), cat('a2', 'A2', 'a', 2),
      cat('b1', 'B1', 'b', 1), cat('b2', 'B2', 'b', 2),
    ];
    expect(reorderWithinSiblings(two, 'b2', 'up')).toEqual(['b2', 'b1']);
    expect(reorderWithinSiblings(two, 'a1', 'down')).toEqual(['a2', 'a1']);
    expect(reorderWithinSiblings(two, 'b', 'down')).toBeNull();
  });
  it('returns null at the edges', () => {
    expect(reorderWithinSiblings(CATS, '5', 'up')).toBeNull();
    expect(reorderWithinSiblings(CATS, '6', 'down')).toBeNull();
  });
});

describe('validateFaqs', () => {
  it('flags blank and over-long fields', () => {
    const r = validateFaqs([
      { question: ' ', answer: 'ok' },
      { question: 'q'.repeat(301), answer: 'a'.repeat(2001) },
      { question: 'q', answer: 'a' },
    ]);
    expect(r.valid).toBe(false);
    expect(r.rows[0].question).toBe('Question is required');
    expect(r.rows[1].question).toMatch(/300/);
    expect(r.rows[1].answer).toMatch(/2000/);
    expect(r.rows[2]).toEqual({});
  });
  it('limits to 20 FAQs', () => {
    const faqs = Array.from({ length: 21 }, () => ({ question: 'q', answer: 'a' }));
    expect(validateFaqs(faqs).form).toMatch(/20/);
    expect(validateFaqs(faqs.slice(0, 20)).valid).toBe(true);
  });
  it('accepts empty list', () => {
    expect(validateFaqs([]).valid).toBe(true);
  });
});

describe('moveItem', () => {
  it('reorders and ignores out-of-range', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });
});

describe('buildCategoryPayload', () => {
  const base: CategoryFormShape = {
    name: 'N', slug: 'n', description: '', is_active: true, meta_title: '', meta_description: '',
    image_keys: ['k'], video_key: null, parent_id: '', seo_intro: '', seo_body: '', faqs: [],
    google_product_category: '  ', noindex: false,
  };
  it('sends explicit null parent_id when cleared', () => {
    const p = buildCategoryPayload(base);
    expect('parent_id' in p).toBe(true);
    expect(p.parent_id).toBeNull();
    expect(JSON.parse(JSON.stringify(p)).parent_id).toBeNull();
  });
  it('sends numeric parent_id when set', () => {
    expect(buildCategoryPayload({ ...base, parent_id: '7' }).parent_id).toBe(7);
  });
  it('sends [] for cleared faqs and null for blank text fields', () => {
    const p = buildCategoryPayload(base);
    expect(p.faqs).toEqual([]);
    expect(p.seo_intro).toBeNull();
    expect(p.seo_body).toBeNull();
    expect(p.google_product_category).toBeNull();
  });
  it('trims faqs and keeps noindex', () => {
    const p = buildCategoryPayload({ ...base, noindex: true, faqs: [{ question: ' Q ', answer: ' A ' }] });
    expect(p.faqs).toEqual([{ question: 'Q', answer: 'A' }]);
    expect(p.noindex).toBe(true);
  });
});
