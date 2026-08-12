// Shared, source-grounded locators + login for the Product Catalog (Admin) specs.
// Every selector here was derived from the real components, not from a live DOM snapshot:
//   ProductForm/BasicInfoSection.tsx — labels are visual siblings of their inputs with no
//     htmlFor/id pairing, so getByLabel() does not work; an XPath sibling lookup off the
//     label's exact text is required (same pattern the Category Management suite needed).
//   ProductForm/MediaSection.tsx     — react-dropzone renders the file inputs; the image one
//     carries accept="image/*,.jpg,..." and the video one accept="video/*,...".
//   ProductForm/index.tsx            — Section() renders a header <button> wrapping an <h3>;
//     'Inventory' and 'SEO Settings' are the only two that start collapsed.
import { expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(HERE, '../fixtures');

function ensureFixtureFile(filePath: string, sizeInBytes: number): string {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dirname(filePath), { recursive: true });
    const fd = fs.openSync(filePath, 'w');
    fs.ftruncateSync(fd, Math.floor(sizeInBytes));
    fs.closeSync(fd);
  }
  return filePath;
}

export const FIXTURES = {
  front: resolve(FIXTURE_DIR, 'product-front.jpg'),
  angle: resolve(FIXTURE_DIR, 'product-angle.jpg'),
  detail: resolve(FIXTURE_DIR, 'product-detail.jpg'),
  extra: resolve(FIXTURE_DIR, 'product-extra.jpg'),
  lowres: resolve(FIXTURE_DIR, 'lowres.jpg'),
  get oversized() {
    return ensureFixtureFile(resolve(FIXTURE_DIR, 'oversized.jpg'), 12.69 * 1024 * 1024);
  },
  get oversizedVideo() {
    return ensureFixtureFile(resolve(FIXTURE_DIR, 'oversized-video.mp4'), 151 * 1024 * 1024);
  },
};

export const ADMIN_EMAIL = 'admin@urgentprinters.com';
export const ADMIN_PASSWORD = 'SuperAdmin@123';

function labelledInput(page: Page, labelText: string): Locator {
  return page.locator(`label:text-is("${labelText}")`).locator('xpath=following-sibling::input[1]');
}

export const nameField = (page: Page) => labelledInput(page, 'Product Name *');
export const slugField = (page: Page) => labelledInput(page, 'Slug *');
export const shortDescField = (page: Page) => labelledInput(page, 'Short Description *');
export const categorySelect = (page: Page) =>
  page.locator('label:text-is("Category *")').locator('xpath=following-sibling::select[1]');
export const imageInput = (page: Page) => page.locator('input[type="file"][accept*="image"]');
export const videoInput = (page: Page) => page.locator('input[type="file"][accept*="video"]');

/** Click a collapsed Section's header. Only 'Inventory' and 'SEO Settings' start closed. */
export async function openSection(page: Page, title: string) {
  await page.locator(`button:has(h3:text-is("${title}"))`).click();
}

/**
 * Auth is infrastructure, not a plan step — recorded under an `auth-` prefix.
 *
 * **Budget note.** `POST /admin/auth/login` is rate-limited to **10 per hour per IP**
 * (`@limiter.limit("10/hour")`, urgent-printers-backend/app/api/v1/routes/admin/auth.py:70) and
 * Playwright gives every test its own browser context, hence its own login. Keep the whole
 * product-catalog suite at four tests or fewer per pass, and remember Playwright **discards a
 * worker after a failing test**, so a failed run costs extra logins on the retry.
 *
 * Replaying a captured `storageState()` to avoid re-logging-in was tried and does not work:
 * the `admin_refresh_token` cookie is rotated on every refresh, so a replayed state presents an
 * already-spent token, the refresh 401s, `client.ts` logs the session out, and the page lands
 * back on /login — which shows up as a pile of unrelated-looking selector timeouts at
 * `route=/login`. Do not reintroduce that shortcut without solving the rotation problem.
 */
export async function login(page: Page, capture: any) {
  await capture.step('auth-01', 'Open the admin login page', null, () => page.goto('/login'));
  await capture.type('auth-02', 'Enter the admin email', page.locator('#email'), ADMIN_EMAIL);
  await capture.type('auth-03', 'Enter the admin password', page.locator('#password'), ADMIN_PASSWORD);
  await capture.step('auth-04', 'Submit the login form', page.getByRole('button', { name: 'Sign in' }), async (el: Locator) => {
    await el.click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
  });
}

/**
 * Fill the create form to the point where it will actually save: name, short description,
 * category, and the three photos the backend's `image_keys: Field(min_length=3)` demands.
 * Used by every spec that needs a *saveable* product; the validation specs deliberately
 * skip parts of this.
 */
export async function fillCreatableProduct(
  page: Page,
  opts: { name: string; shortDescription?: string; category?: string | null },
) {
  await nameField(page).fill(opts.name);
  if (opts.shortDescription !== undefined) await shortDescField(page).fill(opts.shortDescription);
  if (opts.category) {
    const select = categorySelect(page);
    await expect(select.locator('option')).not.toHaveCount(1, { timeout: 15_000 });
    await select.selectOption({ label: opts.category });
  }
  await imageInput(page).setInputFiles([FIXTURES.front, FIXTURES.angle, FIXTURES.detail]);
  await expect(page.getByText('Minimum of 3 photos met (3/8).')).toBeVisible({ timeout: 60_000 });
}

/**
 * Wait for the products DataTable to finish its skeleton pass. Counting rows before this
 * resolves silently returns 0 and makes cleanup a no-op — which is exactly how a leftover
 * test product survived the first run of this suite.
 */
export async function waitForProductsTable(page: Page) {
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('tbody tr [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
}

/** Archive a product by name from the /products list — used to clean up after a spec. */
export async function archiveProductByName(page: Page, name: string) {
  await page.goto('/products');
  await waitForProductsTable(page).catch(() => {});
  const row = page.locator('tr', { hasText: name });
  if ((await row.count()) === 0) return;
  await row.first().locator('button').last().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Archive Product' }).click();
  await expect(page.getByText(`"${name}" archived`)).toBeVisible({ timeout: 30_000 });
}

/**
 * Archive any product whose name is blank. Publishing the empty create form currently
 * succeeds (the required-field defect this suite exists to catch), and the row it leaves
 * behind is `status: active` with an empty slug — i.e. live on the storefront. Cleaning it
 * up is part of that test, not an optional tidy-up.
 */
export async function archiveNamelessProducts(page: Page) {
  await page.goto('/products');
  await waitForProductsTable(page).catch(() => {});
  for (let guard = 0; guard < 5; guard += 1) {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    let target = -1;
    for (let i = 0; i < count; i += 1) {
      const nameText = (await rows.nth(i).locator('td:first-child a').innerText().catch(() => 'x')).trim();
      if (nameText === '') {
        target = i;
        break;
      }
    }
    if (target === -1) return;
    await rows.nth(target).locator('button').last().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Archive Product' }).click();
    await expect(page.getByText('archived', { exact: false })).toBeVisible({ timeout: 30_000 });
    await page.goto('/products');
    await waitForProductsTable(page).catch(() => {});
  }
}
