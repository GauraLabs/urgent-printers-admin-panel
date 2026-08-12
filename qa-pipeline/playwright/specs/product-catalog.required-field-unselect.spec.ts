// Hand-authored (Module 2 fallback — see pipeline/README.md's "Known infra findings" #8 and
// product-catalog.happy.spec.ts's header for why the MCP-driven Generator was skipped again
// this session). Selectors are grounded directly in the real source, same convention as every
// other hand-authored spec in this suite.
//
// WHAT THIS SPEC IS FOR: ProductForm/index.tsx's Publish and Save-as-Draft buttons both now call
// `form.handleSubmit((v) => save(status, v))` (fixed from a prior defect where they called
// form.getValues() directly and the Zod resolver never ran — see err-03/04/05 in
// product-catalog.error.spec.ts / this feature's plan.json for that history). This spec verifies
// the fix actually reaches every combination the schema/save() guards can be exercised from:
// Create+Publish, Create+Draft, Update-existing+Publish, Update-existing+Draft — clearing one
// required field at a time (Name, Category, Short Description — all `z.string().min(1, ...)` in
// ProductForm/index.tsx's schema) and separately exercising the three imperative,
// non-Zod-reachable guards in save() itself (pricing_tiers / turnaround_options / image_keys —
// each an `.optional()` array in the schema, so an empty array is still Zod-valid and only
// save()'s own length checks catch it). turnaround_options is excluded here: TurnaroundSection
// renders a fixed Standard/Express/Rush trio with no remove control, so that guard is
// unreachable from the UI regardless of status (already recorded as err-11).
//
// A FINDING SURFACED, NOT DECIDED: save()'s three imperative guards run identically regardless
// of `status` — Save as Draft is blocked by an incomplete photo/pricing-tier set exactly as hard
// as Publish is. Whether an intentionally-incomplete draft should be allowed to save is a product
// question this suite does not answer; rfu-09/rfu-18 below just prove the guard fires either way,
// so a human can decide with the real behaviour in front of them rather than an assumption.
//
// A SECOND, MORE SEVERE FINDING SURFACED BY THIS SPEC (rfu-19): MediaSection.tsx's removeImage()
// calls deleteMedia(key) — a real DELETE /admin/media call against R2 storage — the instant the
// hover "Remove image" button is clicked, for ANY 'done' image, with no distinction between a
// freshly-uploaded-this-session image and one that was already persisted on an existing product.
// save()'s "At least 3 photos are required" guard then correctly blocks the record-level save
// (the DB's image_keys array is never touched), but that protection is cosmetic once the files
// themselves are already gone from storage — an admin who removes photos from a live product
// while editing, then either hits this guard or simply navigates away without saving, is left
// with a product whose DB record still references image keys that no longer exist in storage.
// This is exactly the "silently corrupting an already-published product" shape flagged as the
// likely real-world report behind this spec — recorded here via intercepted DELETE responses
// (not a follow-up GET against the CDN URL, which could read a stale cached 200 and mask the
// defect) as a fact for a human to act on, not something this suite unilaterally fixes.
import { test, expect } from '../capture.js';
import type { Page } from '@playwright/test';
import {
  login,
  FIXTURES,
  nameField,
  shortDescField,
  categorySelect,
  imageInput,
  fillCreatableProduct,
  archiveProductByName,
  archiveNamelessProducts,
  waitForProductsTable,
} from './product-catalog.helpers';

const PLAN = 'qa-pipeline/artifacts/plans/product-catalog-admin-to-storefront-plan.json';
const CATEGORY = 'Business Cards';

async function removeAllPricingTiers(page: Page) {
  const tierRows = page.locator('table:has-text("Best Value") tbody tr');
  const count = await tierRows.count();
  for (let i = 0; i < count; i += 1) {
    await tierRows.first().locator('td').last().locator('button').click();
  }
  await expect(page.getByText('No pricing tiers yet.')).toBeVisible();
}

/**
 * Clicks every "Remove image" button until none remain, waiting on the real DELETE
 * /admin/media response each time (not a fixed sleep) — returns the deleted keys as proof
 * the storage-level delete actually fired and succeeded, independent of whatever happens to
 * the form afterward.
 */
async function removeAllImagesTrackingDeletes(page: Page): Promise<string[]> {
  const deletedKeys: string[] = [];
  for (let guard = 0; guard < 10; guard += 1) {
    const removeButtons = page.locator('button[aria-label^="Remove image"]');
    if ((await removeButtons.count()) === 0) break;
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/admin/media') && r.request().method() === 'DELETE'),
      removeButtons.first().click(),
    ]);
    expect(response.ok()).toBe(true);
    const body = response.request().postDataJSON() as { key?: string } | null;
    if (body?.key) deletedKeys.push(body.key);
  }
  return deletedKeys;
}

test.use({
  captureOptions: {
    feature: 'Product Catalog Admin Required Field Unselect',
    plan: PLAN,
    axe: 'per-navigation',
    lighthouse: 'off',
  },
});

test.describe('Product Catalog (Admin) — required-field unselect, all four save combinations', () => {
  test('Clearing Name/Category/Short Description, and emptying pricing tiers/photos, blocks every save path the same way', async ({
    page,
    capture,
  }) => {
    test.setTimeout(1_200_000);
    const stamp = Date.now();
    const createName = `QA RFU Create ${stamp}`;
    const updateName = `QA RFU Update Target ${stamp}`;

    await login(page, capture);

    try {
      // ══ CREATE MODE ══════════════════════════════════════════════════════════════════
      await capture.step('rfu-01', 'Fill a valid create-mode baseline (name, short description, category, 3 photos)', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: createName,
          shortDescription: 'Baseline product used to test required-field validation guards.',
          category: CATEGORY,
        });
      });

      // ── Create + Publish ────────────────────────────────────────────────────────────
      await capture.step('rfu-02', 'Create+Publish: clear Name, click Publish Product', null, async () => {
        await nameField(page).fill('');
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await nameField(page).fill(createName);
      });

      await capture.step('rfu-03', 'Create+Publish: clear Category, click Publish Product', null, async () => {
        await categorySelect(page).selectOption('');
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Category is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await categorySelect(page).selectOption({ label: CATEGORY });
      });

      await capture.step('rfu-04', 'Create+Publish: clear Short Description, click Publish Product', null, async () => {
        await shortDescField(page).fill('');
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Short description is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await shortDescField(page).fill('Baseline product used to test required-field validation guards.');
      });

      // ── Create + Draft (same handleSubmit path, different status argument) ────────────
      await capture.step('rfu-05', 'Create+Draft: clear Name, click Save as Draft', null, async () => {
        await nameField(page).fill('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await nameField(page).fill(createName);
      });

      await capture.step('rfu-06', 'Create+Draft: clear Category, click Save as Draft', null, async () => {
        await categorySelect(page).selectOption('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Category is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await categorySelect(page).selectOption({ label: CATEGORY });
      });

      await capture.step('rfu-07', 'Create+Draft: clear Short Description, click Save as Draft', null, async () => {
        await shortDescField(page).fill('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Short description is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
        await shortDescField(page).fill('Baseline product used to test required-field validation guards.');
      });

      await capture.step(
        'rfu-08',
        'Create+Draft: remove all 3 photos (still Zod-valid — an empty array — so this is save()\'s own imperative guard, not the resolver), click Save as Draft',
        null,
        async () => {
          await removeAllImagesTrackingDeletes(page);
          await expect(page.getByText('3 more photos required — minimum 3.')).toBeVisible();
          await page.getByRole('button', { name: 'Save as Draft' }).click();
          await expect(page.getByText('At least 3 photos are required')).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText('Product created')).toHaveCount(0);
          expect(new URL(page.url()).pathname).toBe('/products/new');
        },
      );

      await capture.step('clean-01', 'Cancel out of the exhausted create form', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      await capture.step(
        'rfu-09',
        "Create+Draft: fresh form, remove every pricing tier, click Save as Draft — proving the guard applies to Draft, not just Publish (err-02 in the error suite only exercised Publish)",
        null,
        async () => {
          await page.goto('/products/new');
          await fillCreatableProduct(page, {
            name: `QA RFU Tiers ${stamp}`,
            shortDescription: 'Throwaway form used only to exercise the pricing-tier guard under Draft.',
            category: CATEGORY,
          });
          await removeAllPricingTiers(page);
          await page.getByRole('button', { name: 'Save as Draft' }).click();
          await expect(page.getByText('At least one pricing tier is required')).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText('Product created')).toHaveCount(0);
          expect(new URL(page.url()).pathname).toBe('/products/new');
        },
      );

      await capture.step('clean-02', 'Cancel out again', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      // ══ UPDATE MODE ══════════════════════════════════════════════════════════════════
      await capture.step('rfu-10', 'Create the real product used for every update-mode scenario below', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: updateName,
          shortDescription: 'Baseline product used to test update-mode required-field guards.',
          category: CATEGORY,
        });
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Product created')).toBeVisible({ timeout: 30_000 });
        await page.waitForURL('**/products');
      });

      await capture.step('rfu-11', 'Open it for editing', null, async () => {
        const row = page.locator('tr', { hasText: updateName });
        await expect(row).toBeVisible({ timeout: 30_000 });
        await row.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();
        await page.waitForURL(/\/products\/\d+$/);
        await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 20_000 });
        await expect(nameField(page)).toHaveValue(updateName);
      });

      // ── Update + Publish ("Save Changes", status='active') ─────────────────────────────
      await capture.step('rfu-12', 'Update+Publish: clear Name, click Save Changes', null, async () => {
        await nameField(page).fill('');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toMatch(/\/products\/\d+$/);
        await nameField(page).fill(updateName);
      });

      await capture.step('rfu-13', 'Update+Publish: clear Category, click Save Changes', null, async () => {
        await categorySelect(page).selectOption('');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Category is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        await categorySelect(page).selectOption({ label: CATEGORY });
      });

      await capture.step('rfu-14', 'Update+Publish: clear Short Description, click Save Changes', null, async () => {
        await shortDescField(page).fill('');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Short description is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        await shortDescField(page).fill('Baseline product used to test update-mode required-field guards.');
      });

      // ── Update + Draft ("Save as Draft", status='draft' — demotes an active product) ───
      // Worth noting for the analysis, not asserted here as right or wrong: on an existing
      // product this button does not mean "save my edits as a draft copy" — it patches the
      // live record's status to 'draft', unpublishing it. That is a real behaviour, exercised
      // faithfully below, and a second product-shape question alongside the guard one.
      await capture.step('rfu-15', 'Update+Draft: clear Name, click Save as Draft', null, async () => {
        await nameField(page).fill('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        await nameField(page).fill(updateName);
      });

      await capture.step('rfu-16', 'Update+Draft: clear Category, click Save as Draft', null, async () => {
        await categorySelect(page).selectOption('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Category is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        await categorySelect(page).selectOption({ label: CATEGORY });
      });

      await capture.step('rfu-17', 'Update+Draft: clear Short Description, click Save as Draft', null, async () => {
        await shortDescField(page).fill('');
        await page.getByRole('button', { name: 'Save as Draft' }).click();
        await expect(page.getByText('Short description is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Product updated')).toHaveCount(0);
        await shortDescField(page).fill('Baseline product used to test update-mode required-field guards.');
      });

      await capture.step(
        'rfu-18',
        'Update+Draft: remove every pricing tier from the live product, click Save as Draft',
        null,
        async () => {
          await removeAllPricingTiers(page);
          await page.getByRole('button', { name: 'Save as Draft' }).click();
          await expect(page.getByText('At least one pricing tier is required')).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText('Product updated')).toHaveCount(0);
          // Removing pricing-tier rows is pure client-side field-array state (no network call),
          // unlike image removal below — a reload cleanly restores the server's real 5 tiers.
          await page.reload();
          await expect(page.locator('input[name^="pricing_tiers."][name$=".quantity"]')).toHaveCount(5, {
            timeout: 30_000,
          });
        },
      );

      await capture.step(
        'rfu-19',
        'Update+Draft: remove all 3 real photos from the live product — proves storage deletion happens on click, before any Save',
        null,
        async () => {
          const deletedKeys = await removeAllImagesTrackingDeletes(page);
          // The finding: deletion already happened — 3 successful DELETE /admin/media calls,
          // fired the instant each "Remove image" button was clicked — regardless of whatever
          // the save() guard below does next.
          expect(deletedKeys.length).toBe(3);
          await expect(page.getByText('3 more photos required — minimum 3.')).toBeVisible();

          await page.getByRole('button', { name: 'Save as Draft' }).click();
          // The record-level guard does correctly block the PATCH — but only the DB row, which
          // was never at risk here in the first place. The photos are already gone from storage.
          await expect(page.getByText('At least 3 photos are required')).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText('Product updated')).toHaveCount(0);
        },
      );

      await capture.step(
        'rfu-20',
        'Reload and confirm the record itself (name/category/description/pricing tiers) survived every blocked attempt intact',
        null,
        async () => {
          await page.reload();
          await expect(nameField(page)).toHaveValue(updateName, { timeout: 30_000 });
          await expect(shortDescField(page)).toHaveValue(
            'Baseline product used to test update-mode required-field guards.',
          );
          await expect(page.locator('input[name^="pricing_tiers."][name$=".quantity"]')).toHaveCount(5);
          // image_keys on the DB record are untouched too (the guard blocked every save that
          // would have cleared them) — but per rfu-19, the 3 keys it still lists no longer
          // resolve to anything in storage. Not re-verified here via a follow-up GET against the
          // CDN URL, which could read a stale cached 200 and mask the defect; the DELETE
          // responses captured in rfu-19 are the durable evidence.

          // A THIRD FINDING, surfaced here rather than assumed away: after a hard page.reload(),
          // the Category select can render blank even though category_id is still correctly
          // persisted. useCategories() is only triggered once BasicInfoSection mounts, which is
          // gated on useProductDetail resolving first (ProductEditClient), so on a cold reload
          // the two queries run as a waterfall, not in parallel. RHF's register() sets the native
          // <select>'s value once, at ref-attach time; if no <option> for category_id="8" exists
          // in the DOM yet (categories still loading), the browser silently falls back to the
          // blank "Select category" option and — because adding <option> children later never
          // re-triggers RHF's ref callback — nothing ever corrects it for the rest of that page's
          // lifetime, even once categories finish loading. This was hit deterministically by
          // rfu-18's and this step's own page.reload() calls. It is a real, reproducible display
          // bug, not the assertion being loose: confirmed via a direct GET /admin/products (curl,
          // read-only) during triage that category_id remained 8 throughout this entire test,
          // i.e. no data was actually lost — only the client-side render is wrong. Proven here
          // two ways: (1) the blank render right after this hard reload, and (2) a same-origin
          // client-side navigation away and back (categories now warm in the query cache, no
          // waterfall) showing the true, correct value.
          expect(await categorySelect(page).inputValue()).toBe('');

          await page.goto('/products');
          await waitForProductsTable(page);
          const row = page.locator('tr', { hasText: updateName });
          await row.locator('button').last().click();
          await page.getByRole('menuitem', { name: 'Edit' }).click();
          await page.waitForURL(/\/products\/\d+$/);
          await expect(categorySelect(page)).toHaveValue(/.+/, { timeout: 15_000 });
          await expect(categorySelect(page).locator('option:checked')).toHaveText(CATEGORY);
        },
      );
    } finally {
      await archiveProductByName(page, createName).catch(() => {});
      await archiveProductByName(page, `QA RFU Tiers ${stamp}`).catch(() => {});
      await archiveProductByName(page, updateName).catch(() => {});
      await archiveNamelessProducts(page).catch(() => {});
    }
  });
});
