// Hand-authored (Module 2 fallback) — see product-catalog.happy.spec.ts's header for why, and
// product-catalog.error.spec.ts's header for why scenarios are batched into few tests (the
// admin login endpoint allows 10 requests per hour per IP and Playwright gives each test its
// own context, i.e. its own login).
//
// Two tests here rather than one: the list-control checks read shared catalogue data whose
// exact contents this suite does not own, so a failure there is the most likely of the two —
// keeping it separate means it cannot abort the form-level edge coverage that follows.
import { test, expect } from '../capture.js';
import type { Page } from '@playwright/test';
import {
  login,
  nameField,
  slugField,
  openSection,
  fillCreatableProduct,
  archiveProductByName,
  waitForProductsTable,
  FIXTURES,
  imageInput,
} from './product-catalog.helpers';

const PLAN = 'qa-pipeline/artifacts/plans/product-catalog-admin-to-storefront-plan.json';

async function rowNames(page: Page): Promise<string[]> {
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  return page.locator('tbody tr td:first-child a').allInnerTexts();
}

/**
 * Base UI Select: trigger carries data-slot="select-trigger", items data-slot="select-item".
 * Changing a filter changes the TanStack query key, so the table drops to skeleton rows before
 * the new page arrives — wait that out, otherwise the assertions read the previous filter's
 * rows (or empty skeleton cells) and report a defect that isn't there.
 */
async function chooseFilter(page: Page, triggerIndex: number, optionLabel: string) {
  await page.locator('[data-slot="select-trigger"]').nth(triggerIndex).click();
  await page.locator('[data-slot="select-item"]', { hasText: optionLabel }).first().click();
  await page.waitForTimeout(1_000);
  await expect(page.locator('tbody [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
}

// ── List controls ─────────────────────────────────────────────────────────────────────────
test.describe('Product Catalog (Admin) — list controls', () => {
  test.use({
    captureOptions: {
      feature: 'Product Catalog Admin List Controls',
      plan: PLAN,
      axe: 'per-navigation',
      lighthouse: 'off',
    },
  });

  test('Search, sort, status/category filters, pagination and column visibility', async ({ page, capture }) => {
    test.setTimeout(600_000);
    await login(page, capture);

    await capture.step('edge-01', 'Open the catalogue list and record the unfiltered rows', null, async () => {
      await page.goto('/products');
      const names = await rowNames(page);
      expect(names.length).toBeGreaterThan(0);
    });

    await capture.step(
      'edge-02',
      'Type a product name into the search box',
      page.getByPlaceholder('Search products…'),
      async (el) => {
        const before = await rowNames(page);
        const term = before[0];
        await el.fill(term);
        // SearchInput debounces 400ms then calls useProducts.setSearch, which now sets a real
        // `q` filter sent to the backend (was previously a no-op stub) — wait out the debounce
        // plus the refetch's skeleton pass before reading the filtered rows.
        await page.waitForTimeout(1_200);
        await expect(page.locator('tbody [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
        const after = await rowNames(page);
        expect(after.length).toBeGreaterThan(0);
        for (const name of after) expect(name.toLowerCase()).toContain(term.toLowerCase());
        expect(after).toContain(term);
      },
    );

    await capture.step(
      'edge-03',
      "Click the 'Product' column header to sort",
      page.getByRole('columnheader', { name: 'Product' }).getByRole('button'),
      async (el) => {
        await page.getByPlaceholder('Search products…').fill('');
        await page.waitForTimeout(1_200);
        const before = await rowNames(page);
        await el.click();
        await page.waitForTimeout(1_000);
        await expect(page.locator('tbody [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
        // ProductsTable now passes sorting/onSortingChange through to a real manualSorting
        // DataTable, and useProducts.ts maps the clicked column to a real backend `sort` param
        // — a first click sorts the current page ascending by name (TanStack's default
        // toggleSorting() order), where it previously left the row order untouched entirely.
        const after = await rowNames(page);
        expect(after.length).toBeGreaterThan(1);
        for (let i = 1; i < after.length; i += 1) {
          expect(after[i - 1].toLowerCase() <= after[i].toLowerCase()).toBe(true);
        }
        await expect(page.getByRole('columnheader', { name: 'Product' }).locator('svg')).toBeVisible();
        void before;
      },
    );

    await capture.step('edge-05', "Compare status 'Draft' against status 'Archived'", null, async () => {
      await chooseFilter(page, 0, 'Draft');
      const draftRows = await rowNames(page).catch(() => [] as string[]);
      await chooseFilter(page, 0, 'Archived');
      const archivedRows = await rowNames(page).catch(() => [] as string[]);
      // status is now the real, canonical, independently-set field passed straight through as
      // the backend's `status` query param (was previously collapsed: both filters sent
      // is_active=false and returned the identical set). A product can only ever hold one
      // status at a time, so the two filters' result sets must not overlap.
      const overlap = draftRows.filter((n) => archivedRows.includes(n));
      expect(overlap).toEqual([]);
    });

    await capture.step('edge-06', 'Filter by a single category', null, async () => {
      await chooseFilter(page, 0, 'All statuses');
      await chooseFilter(page, 1, 'Business Cards');
      const categoryCells = await page.locator('tbody tr td:first-child p').allInnerTexts();
      expect(categoryCells.length).toBeGreaterThan(0);
      for (const c of categoryCells) expect(c).toBe('Business Cards');
    });

    await capture.step('edge-07', 'Check the pagination footer against the row count', null, async () => {
      await chooseFilter(page, 1, 'All categories');
      const rows = await page.locator('tbody tr').count();
      const footer = page.getByText(/Showing \d+–\d+ of \d+ results/);
      // `exact: true` matters here: the Next.js dev-server overlay injects a button whose
      // accessible name is "Open Next.js Dev Tools", which a substring match on "Next" also
      // picks up — a strict-mode violation that only ever appears against a dev server.
      const nextButton = page.getByRole('button', { name: 'Next', exact: true });
      const prevButton = page.getByRole('button', { name: 'Previous', exact: true });
      if (rows < 20) {
        // DataTable only renders the footer when totalPages > 1 — with a single page of
        // results the correct behaviour is no pagination controls at all.
        await expect(footer).toHaveCount(0);
        await expect(nextButton).toHaveCount(0);
      } else {
        await expect(footer).toBeVisible();
        await expect(prevButton).toBeDisabled();
        await nextButton.click();
        await expect(prevButton).toBeEnabled({ timeout: 30_000 });
        await prevButton.click();
        await expect(prevButton).toBeDisabled({ timeout: 30_000 });
      }
    });

    await capture.step('edge-08', 'Hide the Created column via the Columns menu', page.getByRole('button', { name: 'Columns' }), async (el) => {
      await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible();
      await el.click();
      await page.getByRole('menuitemcheckbox', { name: 'Created' }).click();
      await expect(page.getByRole('columnheader', { name: 'Created' })).toHaveCount(0);
    });

    // Deliberately last: this is the one assertion here that depends on catalogue data this
    // suite does not own, so if it fails it must not cost the coverage above.
    await capture.step('edge-04', "Filter the list to status 'Active'", null, async () => {
      await page.goto('/products');
      await waitForProductsTable(page);
      await chooseFilter(page, 0, 'Active');
      const badges = await page.locator('tbody tr td:nth-child(2)').allInnerTexts();
      expect(badges.length).toBeGreaterThan(0);
      // The filter sends is_active=true while the badge renders `status`, so a row whose two
      // fields disagree shows up here as a Draft/Archived badge under the Active filter.
      for (const b of badges) expect(b).toContain('Active');
    });
  });
});

// ── Form-level edges ──────────────────────────────────────────────────────────────────────
test.describe('Product Catalog (Admin) — form edges', () => {
  test.use({
    captureOptions: {
      feature: 'Product Catalog Admin Form Edges',
      plan: PLAN,
      axe: 'per-navigation',
      lighthouse: 'off',
    },
  });

  test('Slug stability, numeric bounds, delete-dialog copy, image cap and SEO counters', async ({ page, capture }) => {
    test.setTimeout(900_000);
    const stamp = Date.now();
    const slugProduct = `QA Slug Guard ${stamp}`;
    const customSlug = `qa-custom-slug-${stamp}`;
    const boundsProduct = `QA Bounds ${stamp}`;
    const deleteProduct = `QA Delete Copy ${stamp}`;

    await login(page, capture);

    try {
      // ── edge-09: the stored slug must survive an edit-page load ────────────────────────
      await capture.step('setup-01', 'Create a product with a hand-written slug', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: slugProduct,
          shortDescription: 'Created with a deliberately hand-written slug.',
          category: 'Business Cards',
        });
        await slugField(page).fill(customSlug);
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Product created')).toBeVisible({ timeout: 30_000 });
        await page.waitForURL('**/products');
      });

      await capture.step('edge-09', 'Re-open that product for editing and inspect the Slug field', null, async () => {
        const row = page.locator('tr', { hasText: slugProduct });
        await expect(row).toBeVisible({ timeout: 30_000 });
        await row.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();
        await page.waitForURL(/\/products\/\d+$/);
        await expect(nameField(page)).toHaveValue(slugProduct, { timeout: 30_000 });

        // BasicInfoSection's useEffect fired on mount with the loaded name and overwrote the
        // slug with slugify(name) — the stored slug must survive an edit-page load untouched,
        // otherwise the next Save Changes silently re-points the public storefront URL.
        await expect(slugField(page)).toHaveValue(customSlug);
      });

      // ── edge-10/11/12: numeric bounds ──────────────────────────────────────────────────
      await capture.step('edge-10', 'Enter a negative unit price and a zero quantity', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: boundsProduct,
          shortDescription: 'Deliberately out-of-range numbers.',
          category: 'Business Cards',
        });
        await page.locator('input[name="pricing_tiers.0.quantity"]').fill('0');
        await page.locator('input[name="pricing_tiers.0.price_per_unit"]').fill('-5');
        await expect(page.locator('input[name="pricing_tiers.0.price_per_unit"]')).toHaveValue('-5');
      });

      await capture.step('edge-11', 'Enter a negative stock quantity', null, async () => {
        await openSection(page, 'Inventory');
        await page
          .locator('label', { hasText: 'Track inventory for this product' })
          .getByRole('switch')
          .click();
        await page.locator('input[name="stock_quantity"]').fill('-10');
        await expect(page.locator('input[name="stock_quantity"]')).toHaveValue('-10');
      });

      await capture.step('edge-12', 'Publish the out-of-range product', page.getByRole('button', { name: 'Publish Product' }), async (el) => {
        await el.click();
        // A negative per-unit price would land straight on the storefront's 'From' price and
        // in an order total, so the save must not go through, and the admin has to be told
        // which number is wrong rather than just seeing nothing happen.
        await expect(page.getByText('Price cannot be negative')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Quantity must be at least 1')).toBeVisible();
        await expect(page.getByText('Stock cannot be negative')).toBeVisible();
        await page.waitForTimeout(5_000);
        await expect(page.getByText('Product created')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe('/products/new');
      });

      // ── edge-15/16: image cap and SEO counters, on the same unsaved form ───────────────
      await capture.step('edge-15', 'Drop ten photos into an 8-image dropzone', imageInput(page), async (el) => {
        const ten = [
          FIXTURES.front, FIXTURES.angle, FIXTURES.detail, FIXTURES.extra, FIXTURES.front,
          FIXTURES.angle, FIXTURES.detail, FIXTURES.extra, FIXTURES.front, FIXTURES.angle,
        ];
        await el.setInputFiles(ten);
        await expect(page.getByText('Minimum of 3 photos met (8/8).')).toBeVisible({ timeout: 240_000 });
        // onImageDrop slices at maxImages, and the dropzone unmounts once full. The two files
        // over the cap are dropped with no message at all — see the analysis's UX gaps.
        await expect(imageInput(page)).toHaveCount(0);
      });

      await capture.step('edge-16', 'Overflow the SEO Meta Title and Meta Description counters', null, async () => {
        await openSection(page, 'SEO Settings');
        await page.locator('input[name="seo.title"]').fill('x'.repeat(70));
        await expect(page.getByText('70/60')).toBeVisible();
        await page.locator('textarea[name="seo.description"]').fill('y'.repeat(170));
        await expect(page.getByText('170/160')).toBeVisible();
      });

      await capture.step('clean-01', 'Cancel out, cleaning up the uploaded media', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      // ── edge-13/14: delete-dialog copy vs. what the action actually does ───────────────
      await capture.step('setup-02', 'Create a product to delete from its edit page', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: deleteProduct,
          shortDescription: 'Created to exercise the edit-page delete dialog.',
          category: 'Business Cards',
        });
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Product created')).toBeVisible({ timeout: 30_000 });
        await page.waitForURL('**/products');
      });

      await capture.step('edge-13', "Open the product and click 'Delete Product'", null, async () => {
        const row = page.locator('tr', { hasText: deleteProduct });
        await expect(row).toBeVisible({ timeout: 30_000 });
        await row.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();
        await page.waitForURL(/\/products\/\d+$/);
        await page.getByRole('button', { name: 'Delete Product' }).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(`Delete "${deleteProduct}"?`)).toBeVisible();
        // Previously this dialog said "This will permanently delete the product. This cannot be
        // undone." while the list's dialog for the identical action said the opposite ("It can
        // be restored..."), and the backend really did delete every image_key/video from
        // storage before archiving — so neither dialog's copy was trustworthy. Both are fixed
        // now: the backend no longer deletes media on archive, and this dialog's copy was
        // corrected to match the list's (verified independently this session, not re-proven
        // here) — assert the two now agree.
        await expect(
          dialog.getByText(
            'The product will be archived and hidden from the storefront. It can be restored by changing its status back to Active.',
          ),
        ).toBeVisible();
      });

      await capture.step('edge-14', 'Confirm, and observe what the action actually reports', null, async () => {
        await page.getByRole('dialog').getByRole('button', { name: 'Delete Product' }).click();
        await expect(page.getByText(`"${deleteProduct}" archived`)).toBeVisible({ timeout: 30_000 });
        await page.waitForURL('**/products');
      });
    } finally {
      await archiveProductByName(page, slugProduct).catch(() => {});
      await archiveProductByName(page, boundsProduct).catch(() => {});
      await archiveProductByName(page, deleteProduct).catch(() => {});
    }
  });
});
