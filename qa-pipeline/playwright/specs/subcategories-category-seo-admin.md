# Subcategories and Category SEO (Admin)

Scenario input for Module 2. Derived from
`qa-pipeline/artifacts/plans/subcategories-category-seo-admin-plan.json` — every selector below
comes from that plan, which in turn comes from the real components. Nothing here invents a
locator the plan did not ground.

**Generation route:** hand-authored, per `pipeline/README.md`'s documented
"hand-authoring fallback" for Module 2. Reasons recorded at the top of the spec file; the
short version is that driving `playwright-test-generator` over the `playwright-test` MCP
server would spend several of the 10-per-hour admin login attempts on exploration (and would
drive a live browser against a tree whose data rules for this run are strict and
user-approved), which is a worse trade here than grounding the selectors by reading the
source. The same choice was made for every previous admin-panel run in this pipeline.

**Seed:** qa-pipeline/playwright/specs/seed.spec.ts

**Single test, single login.** `product-catalog.helpers.ts` records that each Playwright test
gets its own browser context and therefore its own `POST /admin/auth/login`, against a
10/hour/IP limit, and that replaying `storageState()` does not work (the refresh cookie
rotates). Every scenario below is therefore one `test()` in one file, in declaration order,
with the create/delete lifecycle wrapped in `try/finally` so the two QA categories are
removed even if an assertion fails mid-run.

---

## Subcategories and Category SEO (Admin) — happy path

### Review the tree, create a top-level category, then a child with full SEO content

**Steps:**
1. Open the categories list — target: `a[href='/categories/new']` ("Add Category") (step_id: hp-01)
2. Read the rolled-up product count on the "Marketing Prints" row — target: `tr:has-text("Marketing Prints") [title^="Products directly in this category"]` (step_id: hp-02)
3. Collapse the "Marketing Prints" row — target: `button[aria-label='Collapse Marketing Prints']` (step_id: hp-03)
4. Expand it again — target: `button[aria-label='Expand Marketing Prints']` (step_id: hp-04)
5. Click "Add Category" — target: `a[href='/categories/new']` (step_id: hp-05)
6. Enter the new top-level category's name — target: `label:text-is('Name *') + input` (step_id: hp-06)
7. Observe the auto-derived slug — target: `label:text-is('Slug *') + input` (step_id: hp-07)
8. Inspect the parent picker on the create form — target: `#category-parent` (step_id: hp-08)
9. Upload one category image — target: `input[type='file'][accept*='image']` (step_id: hp-09)
10. Submit the create form — target: `button:text-is('Create Category')` (step_id: hp-10)
11. Start a second category and name it as the child — target: `label:text-is('Name *') + input` (step_id: hp-11)
12. Choose the new top-level category as the parent — target: `#category-parent` (step_id: hp-12)
13. Fill Meta Title and Meta Description, watch the counters — target: SEO section inputs (step_id: hp-13)
14. Read the Google snippet preview — target: `[data-testid='snippet-preview']` (step_id: hp-14)
15. Fill the intro and body copy — target: "Intro text" / "Body text" textareas (step_id: hp-15)
16. Add two FAQs — target: `button:has-text('Add FAQ')`, `[aria-label='FAQ 1 question']` (step_id: hp-16)
17. Move the second FAQ up — target: `button[aria-label='Move FAQ 2 up']` (step_id: hp-17)
18. Enter a Google product category and switch noindex on — target: "Google product category" input; `switch[name*='noindex']` by its label (step_id: hp-18)
19. Submit the child category — target: `button:text-is('Create Category')` (step_id: hp-19)
20. Re-open the child and verify the SEO content round-tripped — target: `/categories/{id}` (step_id: hp-20)

**Expect:** the tree renders indented parent-before-children with direct and rolled-up counts;
both categories save; the child lands one level under its parent; every SEO field, both FAQs in
their reordered order, and the noindex switch come back on re-open.

---

## Subcategories and Category SEO (Admin) — alternate paths

### Product form shows a grouped Parent > Child category select

**Steps:**
1. Open `/products/new` and inspect the Category select's options — target: `select[name='category_id']` (step_id: alt-01)
2. Select a parent category that has children — target: same select (step_id: alt-02)
3. Switch to one of its children — target: same select (step_id: alt-03)

**Expect:** children are grouped under an `<optgroup>` labelled with the parent and read as
`Parent > Child`; selecting the parent shows `[data-testid='parent-category-warning']`, selecting
a leaf clears it. The form is never submitted.

### Products list filter rolls up descendants and shows the path label

**Steps:**
1. Read the category sub-label under "A5 Flyers" — target: products table row (step_id: alt-04)
2. Filter by the parent "Marketing Prints" — target: category `[data-slot='select-trigger']` (step_id: alt-05)
3. Read the filter trigger's own label — target: same trigger (step_id: alt-06)
4. Filter by the subcategory "Stickers & Labels > Die-cut Stickers" instead — target: same trigger (step_id: alt-07)

**Expect:** the sub-label is the full path; the parent filter returns the descendants' products
(`include_descendants=true`); the trigger shows a human label, never a raw id; the option labels
are full paths.

### Bulk "Move to category…" driven to confirmation and cancelled

**Steps:**
1. Select one product row and open "Move to category…" — target: `[aria-label='Select row']`, `button:has-text('Move to category…')` (step_id: alt-08)
2. Pick a target that has children — target: `select#bulk-move-target` (step_id: alt-09)
3. Pick the subcategory and click Continue — target: `select#bulk-move-target`, `button:text-is('Continue')` (step_id: alt-10)
4. Back out without moving anything — target: `button:text-is('Back')`, `button:text-is('Cancel')` (step_id: alt-11)

**Expect:** the parent-target warning shows; the confirm step names the count and the full target
path; backing out sends no `PATCH /admin/products/bulk-category` and moves no product. **The
confirm button is deliberately never clicked** — moving a real product is out of scope for this
run (the real move was verified live earlier).

### Navigation-link picker shows full category paths

**Steps:**
1. Open `/content/navigation` and click "Add Link" — target: `button:has-text('Add Link')` (step_id: alt-12)
2. Open the category picker's option list — target: the target picker's `[data-slot='select-trigger']` (step_id: alt-13)

**Expect:** subcategory options read as their full path in tree order. The link is never saved.

### Slug-change warning

**Steps:**
1. Change the slug on an existing category's edit form — target: `label:text-is('Slug *') + input` (step_id: alt-14)
2. Restore the original slug — target: same input (step_id: alt-15)

**Expect:** `[data-testid='slug-warning']` (role=alert) appears naming the old and new URL, and
disappears again when the slug matches the stored one. Nothing is saved.

### Parent picker is disabled for a category that already has children

**Steps:**
1. Open the parent category's edit form and inspect the picker — target: `#category-parent` (step_id: alt-16)
2. Confirm a childless category's picker excludes only itself — target: `#category-parent` (step_id: alt-17)

**Expect:** disabled with "This category has subcategories, so it must stay top-level."; the
childless category's own name is absent from its options while other top-level ones are present.

---

## Subcategories and Category SEO (Admin) — error paths

### Deleting a parent that still has subcategories is rejected

**Steps:**
1. Open the parent row's menu, choose Delete, read the warning, and confirm anyway — target: `button:text-is('Delete Category')` (step_id: err-01)

**Expect:** the dialog warns it has 1 subcategory; confirming returns 409 and the toast
`"<name>" still has subcategories. Move or delete its subcategories first.`; the row stays and
the category is still there afterwards.

### A blank FAQ row blocks the save

**Steps:**
1. Add an empty FAQ row and submit — target: `button:has-text('Add FAQ')`, `button:text-is('Save Changes')` (step_id: err-02)

**Expect:** "Question is required" and "Answer is required" render under the row and no request
is sent (no "Category updated" toast).

### Server-side tree guards (no UI path exists — asserted over the authenticated API)

**Steps:**
1. `PATCH /admin/categories/{parent}` with `parent_id` = its own child (step_id: err-03)
2. `PATCH /admin/categories/{child}` with `parent_id` = itself (step_id: err-04)
3. `PATCH /admin/categories/{parent}` (which has a child) with `parent_id` = another top-level category (step_id: err-05)

**Expect:** 422 with "Parent would create a cycle in the category tree", "A category cannot be
its own parent", and "A category with subcategories cannot become a subcategory (max depth 2)"
respectively; each category's `parent_id` is unchanged afterwards. The bearer token is lifted
from a request the already-logged-in page made, so these cost no extra login.

---

## Subcategories and Category SEO (Admin) — edge cases

**Steps:**
1. Click "Add FAQ" up to the 20-row cap — target: `button:has-text('Add FAQ')` (step_id: edge-01)
2. Enter a Meta Title longer than 60 characters — target: "Meta Title" input and its counter (step_id: edge-02)
3. Enter intro copy longer than 2000 characters and submit — target: "Intro text" textarea (step_id: edge-03)
4. Delete the subcategory — target: row menu -> Delete -> `button:text-is('Delete Category')` (step_id: edge-04)
5. Delete the now-childless parent — target: same (step_id: edge-05)

**Expect:** the Add FAQ button disables at "(20/20)"; the Meta Title counter turns destructive
but the field stays valid (advisory only); the intro shows the hard "Max 2000 characters" error
and blocks the save; both QA categories delete cleanly, child first, leaving the tree exactly as
it was found.

---

## Not generated — unvalidated or unreachable edge cases

- **Bulk move of more than 500 products** — `MAX_BULK_MOVE` (client) and
  `BulkCategoryMoveRequest.product_ids` `max_length=500` (server) both guard it, but the dev
  catalog has 12 products, so the cap is unreachable without creating ~500 rows.
- **A `products.view`-only role seeing the bulk toolbar** — gated on
  `usePermissions().canManageProducts` client-side and `require_permission('products.edit')`
  server-side, but only a super-admin account is seeded here and creating a restricted staff
  user would be an unapproved DB mutation.
- **Stale-cache parent picker** (a concurrently-created child making a cached parent option
  ineligible) — no client-side validation exists by design; the server's `validate_parent` is
  the guard, which err-03..err-05 already assert.
- **Sibling-scoped reorder across two parents** — belongs to the Category Management plan,
  which already owns the reorder steps; every dev category sits at `sort_order` 0 so the arrows
  here would mostly exercise the name tie-break.
