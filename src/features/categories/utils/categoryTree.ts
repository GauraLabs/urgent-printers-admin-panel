import type {
  Category, CategoryCreateRequest, CategoryFaq, CategoryUpdateRequest,
} from '@/lib/api/categories';

export const MAX_FAQS = 20;
export const FAQ_QUESTION_MAX = 300;
export const FAQ_ANSWER_MAX = 2000;
export const SEO_INTRO_MAX = 2000;
export const SEO_BODY_MAX = 20000;
export const GOOGLE_CATEGORY_MAX = 255;

type TreeInput = Pick<Category, 'id' | 'name' | 'parent_id' | 'sort_order'>;

export type TreeRow<T extends TreeInput> = T & { depth: number; hasChildren: boolean };

function bySortOrder<T extends TreeInput>(a: T, b: T): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

/** Parent-before-children order. A category whose parent is missing is treated as top-level. */
export function buildTreeRows<T extends TreeInput>(categories: T[]): TreeRow<T>[] {
  const ids = new Set(categories.map((c) => c.id));
  const childrenOf = new Map<string | null, T[]>();
  for (const c of categories) {
    const key = c.parent_id && ids.has(c.parent_id) && c.parent_id !== c.id ? c.parent_id : null;
    const list = childrenOf.get(key) ?? [];
    list.push(c);
    childrenOf.set(key, list);
  }
  const out: TreeRow<T>[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    for (const c of [...(childrenOf.get(parent) ?? [])].sort(bySortOrder)) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ ...c, depth, hasChildren: (childrenOf.get(c.id)?.length ?? 0) > 0 });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Drops descendants of any collapsed row. */
export function visibleRows<T extends TreeInput>(rows: TreeRow<T>[], collapsed: ReadonlySet<string>): TreeRow<T>[] {
  const out: TreeRow<T>[] = [];
  let hideBelow: number | null = null;
  for (const r of rows) {
    if (hideBelow !== null) {
      if (r.depth > hideBelow) continue;
      hideBelow = null;
    }
    out.push(r);
    if (r.hasChildren && collapsed.has(r.id)) hideBelow = r.depth;
  }
  return out;
}

export interface ParentOptions {
  options: Category[];
  disabled: boolean;
  reason: string | null;
}

/** Max depth is 2: only top-level categories can be parents, and a category with children cannot get one. */
export function eligibleParents(categories: Category[], selfId?: string): ParentOptions {
  const hasChildren = selfId ? categories.some((c) => c.parent_id === selfId) : false;
  if (hasChildren) {
    return { options: [], disabled: true, reason: 'This category has subcategories, so it must stay top-level.' };
  }
  const options = categories
    .filter((c) => c.parent_id === null && c.id !== selfId)
    .sort(bySortOrder);
  return { options, disabled: false, reason: null };
}

export function categoryPath(categories: Pick<Category, 'id' | 'name' | 'parent_id'>[], id: string | null | undefined): string {
  if (!id) return '';
  const byId = new Map(categories.map((c) => [c.id, c]));
  const names: string[] = [];
  const guard = new Set<string>();
  let cur = byId.get(id);
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    names.unshift(cur.name);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return names.join(' > ');
}

export interface CategoryOption {
  id: string;
  label: string;
  depth: number;
  hasChildren: boolean;
  parentId: string | null;
}

/** Flat list in tree order with `Parent > Child` labels, for grouped selects and pickers. */
export function categoryOptions(categories: Category[]): CategoryOption[] {
  return buildTreeRows(categories).map((r) => ({
    id: r.id,
    label: categoryPath(categories, r.id),
    depth: r.depth,
    hasChildren: r.hasChildren,
    parentId: r.parent_id,
  }));
}

export function siblingIds(categories: Category[], id: string): string[] {
  const self = categories.find((c) => c.id === id);
  if (!self) return [];
  const ids = new Set(categories.map((c) => c.id));
  const parent = self.parent_id && ids.has(self.parent_id) ? self.parent_id : null;
  return categories
    .filter((c) => (c.parent_id && ids.has(c.parent_id) ? c.parent_id : null) === parent)
    .sort(bySortOrder)
    .map((c) => c.id);
}

/** New order for the moved category's siblings only; null when the move is a no-op. */
export function reorderWithinSiblings(categories: Category[], id: string, dir: 'up' | 'down'): string[] | null {
  const ids = siblingIds(categories, id);
  const idx = ids.indexOf(id);
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= ids.length) return null;
  const next = [...ids];
  [next[idx], next[swap]] = [next[swap], next[idx]];
  return next;
}

export interface FaqRowError { question?: string; answer?: string }

/** Mirrors backend CategoryFaq / MAX_FAQS. Returns one entry per row; empty object means valid. */
export function validateFaqs(faqs: CategoryFaq[]): { rows: FaqRowError[]; form: string | null; valid: boolean } {
  const rows = faqs.map((f): FaqRowError => {
    const e: FaqRowError = {};
    const q = f.question.trim();
    const a = f.answer.trim();
    if (!q) e.question = 'Question is required';
    else if (q.length > FAQ_QUESTION_MAX) e.question = `Max ${FAQ_QUESTION_MAX} characters`;
    if (!a) e.answer = 'Answer is required';
    else if (a.length > FAQ_ANSWER_MAX) e.answer = `Max ${FAQ_ANSWER_MAX} characters`;
    return e;
  });
  const form = faqs.length > MAX_FAQS ? `At most ${MAX_FAQS} FAQs` : null;
  const valid = form === null && rows.every((r) => !r.question && !r.answer);
  return { rows, form, valid };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface CategoryFormShape {
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
  image_keys: string[];
  video_key?: string | null;
  parent_id: string;
  seo_intro?: string;
  seo_body?: string;
  faqs: CategoryFaq[];
  google_product_category?: string;
  noindex: boolean;
}

function blankToNull(v: string | undefined): string | null {
  const t = (v ?? '').trim();
  return t ? t : null;
}

export function buildCategoryPayload(values: CategoryFormShape): CategoryCreateRequest & CategoryUpdateRequest {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    is_active: values.is_active,
    meta_title: values.meta_title || null,
    meta_description: values.meta_description || null,
    image_keys: values.image_keys ?? [],
    video_key: values.video_key ?? null,
    // Explicit null clears the parent (PATCH is field-present); never undefined.
    parent_id: values.parent_id ? Number(values.parent_id) : null,
    seo_intro: blankToNull(values.seo_intro),
    seo_body: blankToNull(values.seo_body),
    faqs: values.faqs.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
    google_product_category: blankToNull(values.google_product_category),
    noindex: values.noindex,
  };
}

export const GOOGLE_TAXONOMY_URL = 'https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt';
