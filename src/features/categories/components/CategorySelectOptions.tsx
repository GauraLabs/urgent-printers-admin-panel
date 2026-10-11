import type { Category } from '@/lib/api/categories';
import { buildTreeRows, categoryPath } from '../utils/categoryTree';

export function selectedCategoryHasChildren(categories: Category[], id: string | null | undefined): boolean {
  return !!id && categories.some((c) => c.parent_id === id);
}

/** `<optgroup>` per parent that has children (parent itself first, then `Parent > Child`); plain options otherwise. */
export function CategorySelectOptions({ categories }: { categories: Category[] }) {
  const rows = buildTreeRows(categories);
  const roots = rows.filter((r) => r.depth === 0);
  return (
    <>
      {roots.map((root) => {
        const children = rows.filter((r) => r.parent_id === root.id);
        if (children.length === 0) return <option key={root.id} value={root.id}>{root.name}</option>;
        return (
          <optgroup key={root.id} label={root.name}>
            <option value={root.id}>{root.name} (top level)</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{categoryPath(categories, c.id)}</option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}
