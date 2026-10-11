// Subcategories and Category SEO — admin half.
//
// Hand-authored, not produced by the playwright-test MCP server's Generator agent — the
// documented Module 2 fallback in pipeline/README.md ("The hand-authoring fallback"). Two
// reasons specific to this run, both recorded in the scenario markdown next to this file:
//   1. `POST /admin/auth/login` is rate-limited to 10/hour/IP and every Playwright context
//      (and every Generator-agent exploration pass) costs one. Spending that budget on live
//      DOM exploration risks 429-ing the capture run itself.
//   2. This run's data rules are strict and user-approved (never touch categories 8-14 /
//      50029 / 50030 or any existing product; never move product 16), and a browser-driving
//      agent cannot be held to them as reliably as a reviewed spec can.
// Consequence, per the README: treat a first-run selector failure here as more likely the
// spec's fault than the app's, and fix the selector rather than filing a defect.
//
// Every selector is grounded in real source, not a DOM snapshot:
//   CategoriesTable.tsx  — depth via inline paddingLeft + data-depth; expand/collapse button
//                          aria-label is `${'Expand'|'Collapse'} ${name}`; the Products cell
//                          is a <span title="Products directly in this category, and
//                          including subcategories"> rendering `direct · total total`.
//   CategoryForm.tsx     — Name/Slug labels are bare siblings of their inputs (no htmlFor),
//                          so an XPath sibling hop is required; the parent picker is the one
//                          field with a real id (#category-parent); the SEO fields' labels
//                          sit inside a flex row next to a CharCount span, so their hop is
//                          `../following-sibling::*[1]`, not `following-sibling::*[1]`.
//   FaqEditor.tsx        — aria-labels `FAQ n question|answer`, `Move FAQ n up|down`,
//                          `Remove FAQ n`; the add button's label carries the `(n/20)` count.
//   SnippetPreview.tsx   — data-testid="snippet-preview".
//   BasicInfoSection.tsx — the product Category select is `select[name="category_id"]`.
//   ProductsTable.tsx    — Base UI Select triggers carry data-slot="select-trigger"; toolbar
//                          order is [0]=status, [1]=category. Row checkbox aria-label is
//                          "Select row" (DataTable.tsx).
//   BulkMoveCategoryDialog.tsx — select#bulk-move-target, data-testid move-confirm /
//                          parent-category-warning, Continue/Back/Cancel button labels.
//   NavLinksManager.tsx  — "Add Link" button; NavLinkTargetPicker renders one Base UI Select.
//
// Lighthouse is off: project.config.json's _notes.auth records that the access token lives in
// memory only, so a post-login final_state checkpoint can be redirected to /login and report
// the wrong page's numbers.
import { test, expect } from '../capture.js';
import type { Locator, Page } from '@playwright/test';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { login } from './product-catalog.helpers';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLACEHOLDER_IMAGE = resolve(HERE, '../fixtures/qa-category-placeholder.png');
const API = 'http://localhost:8000/api/v1';

/** Minimal flat-colour PNG, generated rather than committed, so the fixture is reproducible. */
function ensurePlaceholderImage(size = 1200): string {
  if (fs.existsSync(PLACEHOLDER_IMAGE)) return PLACEHOLDER_IMAGE;
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x += 1) {
    row[1 + x * 3] = 37;
    row[2 + x * 3] = 99;
    row[3 + x * 3] = 235;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  fs.mkdirSync(dirname(PLACEHOLDER_IMAGE), { recursive: true });
  fs.writeFileSync(
    PLACEHOLDER_IMAGE,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
  return PLACEHOLDER_IMAGE;
}

// ── Grounded locators ─────────────────────────────────────────────────────────────────────
const nameField = (page: Page) =>
  page.locator('label:text-is("Name *")').locator('xpath=following-sibling::input[1]');
const slugField = (page: Page) =>
  page.locator('label:text-is("Slug *")').locator('xpath=following-sibling::input[1]');
const parentPicker = (page: Page) => page.locator('#category-parent');
const imageInput = (page: Page) => page.locator('input[type="file"][accept*="image"]');
/** SEO labels live inside a flex row beside their CharCount, so hop off the row, not the label. */
const seoField = (page: Page, label: string, tag: 'input' | 'textarea') =>
  page.locator(`label:text-is("${label}")`).locator(`xpath=../following-sibling::${tag}[1]`);
const seoCounter = (page: Page, label: string) =>
  page.locator(`label:text-is("${label}")`).locator('xpath=following-sibling::span[1]');
const googleCategoryField = (page: Page) =>
  page.locator('label:text-is("Google product category")').locator('xpath=following-sibling::input[1]');
const addFaqButton = (page: Page) => page.getByRole('button', { name: /^Add FAQ/ });
const categoryRow = (page: Page, name: string) => page.locator('tr', { hasText: name });
const countCell = (page: Page, name: string) =>
  categoryRow(page, name).locator('[title^="Products directly in this category"]');

async function waitForCategoryRows(page: Page) {
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('tbody [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
}

/**
 * `capture.step()` measures the bounding box BEFORE acting (the renderer animates a cursor to
 * where the element was), and `validate.mjs run` rejects a box that lies entirely outside the
 * 1280x720 viewport. The category form is ~2000px tall, so anything in the SEO section has to
 * be scrolled into view first or the recorded box is off-screen even though the interaction
 * itself succeeds (Playwright auto-scrolls during the action, after the measurement).
 */
async function intoView(locator: Locator): Promise<Locator> {
  await locator.scrollIntoViewIfNeeded();
  return locator;
}

async function waitForProductRows(page: Page) {
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('tbody [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
}

/**
 * Click a Base UI Select item by its exact label. `hasText` would match 'Marketing Prints'
 * against 'Marketing Prints > Posters' too, which is exactly the distinction several of these
 * assertions exist to make, so match on trimmed innerText instead.
 */
async function chooseSelectItem(page: Page, trigger: Locator, exactLabel: string) {
  await trigger.click();
  const items = page.locator('[data-slot="select-item"]');
  await expect(items.first()).toBeVisible({ timeout: 10_000 });
  const count = await items.count();
  for (let i = 0; i < count; i += 1) {
    const text = (await items.nth(i).innerText()).trim();
    if (text === exactLabel) {
      await items.nth(i).click();
      return;
    }
  }
  throw new Error(`no select item with exact label "${exactLabel}" (saw ${count} items)`);
}

async function selectItemLabels(page: Page, trigger: Locator): Promise<string[]> {
  await trigger.click();
  const items = page.locator('[data-slot="select-item"]');
  await expect(items.first()).toBeVisible({ timeout: 10_000 });
  const labels = (await items.allInnerTexts()).map((t) => t.trim());
  await page.keyboard.press('Escape');
  return labels;
}

/** Read a category's numeric id off its row link (href = ROUTES.CATEGORY_DETAIL(id)). */
async function categoryIdFromRow(page: Page, name: string): Promise<string> {
  const href = await categoryRow(page, name).getByRole('link', { name }).getAttribute('href');
  const id = href?.split('/').pop();
  if (!id || !/^\d+$/.test(id)) throw new Error(`could not read a category id from href "${href}"`);
  return id;
}

/** Open a category's edit form from the list by clicking its name link. */
async function openCategoryEdit(page: Page, name: string) {
  await page.goto('/categories');
  await waitForCategoryRows(page);
  await categoryRow(page, name).getByRole('link', { name }).click();
  await page.waitForURL(/\/categories\/\d+$/, { timeout: 20_000 });
  await expect(nameField(page)).toHaveValue(name, { timeout: 20_000 });
}

/** Delete a category from the list via its row menu. Resolves to the toast's text. */
async function deleteCategoryRow(page: Page, name: string) {
  await page.goto('/categories');
  await waitForCategoryRows(page);
  const row = categoryRow(page, name);
  await row.locator('button').last().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: 'Delete Category' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Delete Category' }).click();
}

test.use({
  captureOptions: {
    feature: 'Subcategories and Category SEO (Admin)',
    plan: 'qa-pipeline/artifacts/plans/subcategories-category-seo-admin-plan.json',
    axe: 'per-navigation',
    lighthouse: 'off',
  },
});

test.describe('Subcategories and Category SEO (Admin)', () => {
  test('Tree, parent picker, SEO content, product wiring, server guards and cleanup', async ({
    page,
    capture,
  }) => {
    test.setTimeout(1_800_000);

    const runId = Date.now().toString().slice(-6);
    const parentName = `QA Parent ${runId}`;
    const childName = `QA Child ${runId}`;
    const image = ensurePlaceholderImage();

    // The admin access token lives in memory only, so err-03..err-05 lift it off a request the
    // logged-in page has already made rather than logging in a second time.
    let bearer: string | null = null;
    page.on('request', (req) => {
      const auth = req.headers().authorization;
      if (auth?.startsWith('Bearer ') && req.url().startsWith(API)) bearer = auth;
    });

    let parentId: string | null = null;
    let childId: string | null = null;

    await login(page, capture);

    try {
      // ── hp-01: the tree renders indented, parent before children ──────────────────────
      await capture.step('hp-01', 'Open the categories list', null, async () => {
        await page.goto('/categories');
        await waitForCategoryRows(page);
      });
      await expect(page.getByRole('link', { name: 'Add Category' })).toBeVisible();
      await expect(categoryRow(page, 'Die-cut Stickers').locator('[data-depth="1"]')).toHaveCount(1);
      await expect(categoryRow(page, 'Flyers & Leaflets').locator('[data-depth="1"]')).toHaveCount(1);
      await expect(categoryRow(page, 'Posters').locator('[data-depth="1"]')).toHaveCount(1);
      await expect(categoryRow(page, 'Marketing Prints').locator('[data-depth="0"]')).toHaveCount(1);

      // ── hp-02: direct vs rolled-up count on a parent with 0 direct products ───────────
      await capture.step(
        'hp-02',
        'Read the direct and rolled-up product counts on the "Marketing Prints" row',
        countCell(page, 'Marketing Prints'),
        async (el) => {
          await expect(el).toHaveText('0 · 2 total');
        },
      );
      await expect(countCell(page, 'Stickers & Labels')).toHaveText('1 · 2 total');

      // ── hp-03 / hp-04: collapse and expand ───────────────────────────────────────────
      await capture.step(
        'hp-03',
        'Collapse the "Marketing Prints" row',
        page.locator('button[aria-label="Collapse Marketing Prints"]'),
        async (el) => {
          await el.click();
          await expect(categoryRow(page, 'Flyers & Leaflets')).toHaveCount(0);
          await expect(categoryRow(page, 'Posters')).toHaveCount(0);
        },
      );
      await expect(page.locator('button[aria-label="Expand Marketing Prints"]')).toHaveAttribute(
        'aria-expanded',
        'false',
      );

      await capture.step(
        'hp-04',
        'Expand "Marketing Prints" again',
        page.locator('button[aria-label="Expand Marketing Prints"]'),
        async (el) => {
          await el.click();
          await expect(categoryRow(page, 'Flyers & Leaflets').locator('[data-depth="1"]')).toHaveCount(1);
          await expect(categoryRow(page, 'Posters').locator('[data-depth="1"]')).toHaveCount(1);
        },
      );

      // ── hp-05..hp-10: create the top-level QA parent ──────────────────────────────────
      await capture.step(
        'hp-05',
        'Click "Add Category"',
        page.getByRole('link', { name: 'Add Category' }),
        async (el) => {
          await el.click();
          await page.waitForURL('**/categories/new');
          await expect(page.getByText('New Category', { exact: true })).toBeVisible();
        },
      );

      await capture.type('hp-06', 'Enter the new category name', nameField(page), parentName);

      await capture.step('hp-07', 'Observe the auto-derived slug', slugField(page), async (el) => {
        await expect(el).toHaveValue(`qa-parent-${runId}`);
        await expect(page.locator('[data-testid="slug-warning"]')).toHaveCount(0);
      });

      await capture.step(
        'hp-08',
        'Inspect the parent picker on the create form',
        parentPicker(page),
        async (el) => {
          await expect(el).toBeEnabled();
          await expect(el).toHaveValue('');
          await expect(el.locator('option').first()).toHaveText('None (top-level)');
          const options = (await el.locator('option').allInnerTexts()).map((t) => t.trim());
          // Only top-level categories are offered (eligibleParents filters parent_id === null).
          expect(options).toContain('Marketing Prints');
          expect(options).toContain('Stickers & Labels');
          expect(options).not.toContain('Posters');
          expect(options).not.toContain('Flyers & Leaflets');
          expect(options).not.toContain('Die-cut Stickers');
          await expect(
            page.getByText('Only top-level categories can be parents (two levels maximum).'),
          ).toBeVisible();
        },
      );

      await capture.step('hp-09', 'Upload one category image', imageInput(page), async (el) => {
        await el.setInputFiles(image);
        await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 60_000 });
      });

      await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
      await capture.step(
        'hp-10',
        'Submit the new top-level category',
        page.getByRole('button', { name: 'Create Category' }),
        async (el) => {
          await el.click();
          await expect(page.getByText('Category created')).toBeVisible({ timeout: 30_000 });
          await page.waitForURL('**/categories');
          await waitForCategoryRows(page);
          await expect(categoryRow(page, parentName).locator('[data-depth="0"]')).toHaveCount(1);
        },
      );
      parentId = await categoryIdFromRow(page, parentName);

      // ── hp-11..hp-22: create the child, with the whole SEO section filled ─────────────
      await page.getByRole('link', { name: 'Add Category' }).click();
      await page.waitForURL('**/categories/new');
      await capture.type('hp-11', 'Enter the subcategory name', nameField(page), childName);
      await expect(slugField(page)).toHaveValue(`qa-child-${runId}`);

      await capture.step(
        'hp-12',
        `Choose "${parentName}" as the parent category`,
        parentPicker(page),
        async (el) => {
          await expect(el.locator('option', { hasText: parentName })).toHaveCount(1, { timeout: 20_000 });
          await el.selectOption({ label: parentName });
          await expect(el).not.toHaveValue('');
        },
      );

      await imageInput(page).setInputFiles(image);
      await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 60_000 });

      const metaTitle = 'Wedding Thank-You Tags — printed in 24 hours';
      const metaDescription =
        'Personalised wedding thank-you tags printed on premium card and delivered across India in 24 hours. Order from 50 pieces.';
      await capture.type('hp-13', 'Enter the meta title', await intoView(seoField(page, 'Meta Title', 'input')), metaTitle);
      await expect(seoCounter(page, 'Meta Title')).toHaveText(`${metaTitle.length}/60`);
      await capture.type(
        'hp-14',
        'Enter the meta description',
        await intoView(seoField(page, 'Meta Description', 'textarea')),
        metaDescription,
      );
      await expect(seoCounter(page, 'Meta Description')).toHaveText(`${metaDescription.length}/160`);

      await capture.step(
        'hp-15',
        'Read the Google snippet preview',
        page.locator('[data-testid="snippet-preview"]'),
        async (el) => {
          await expect(el).toContainText(metaTitle);
          await expect(el).toContainText(metaDescription);
          await expect(el).toContainText(`products › qa-child-${runId}`);
        },
      );

      const intro =
        'Thank-you tags are printed on 300gsm card, cut to shape, and dispatched within 24 hours. Order from 50 pieces, with free delivery over Rs. 1,500.';
      await capture.type('hp-16', 'Enter the answer-first intro copy', await intoView(seoField(page, 'Intro text', 'textarea')), intro);
      await expect(seoCounter(page, 'Intro text')).toHaveText(`${intro.length}/2000`);
      await capture.type(
        'hp-17',
        'Enter the longer body copy',
        await intoView(seoField(page, 'Body text', 'textarea')),
        'Every tag is printed to order on premium uncoated card, so the colours stay true to the invitation suite they accompany. Choose a shape, add the names and date, and approve the digital proof before we print.',
      );

      await capture.step('hp-18', 'Add two FAQs and fill both', addFaqButton(page), async (el) => {
        await el.click();
        await page.locator('[aria-label="FAQ 1 question"]').fill('How soon can thank-you tags ship?');
        await page
          .locator('[aria-label="FAQ 1 answer"]')
          .fill('Standard turnaround is 24 hours from proof approval; express is same-day on orders placed before 11am.');
        await el.click();
        await page.locator('[aria-label="FAQ 2 question"]').fill('What is the minimum order?');
        await page.locator('[aria-label="FAQ 2 answer"]').fill('50 tags. Price per tag drops at 100, 250 and 500.');
        await expect(page.locator('[data-testid="faq-row"]')).toHaveCount(2);
        await expect(addFaqButton(page)).toContainText('(2/20)');
      });

      await capture.step(
        'hp-19',
        'Move the second FAQ above the first',
        page.locator('button[aria-label="Move FAQ 2 up"]'),
        async (el) => {
          await el.click();
          await expect(page.locator('[aria-label="FAQ 1 question"]')).toHaveValue('What is the minimum order?');
          await expect(page.locator('[aria-label="FAQ 2 question"]')).toHaveValue(
            'How soon can thank-you tags ship?',
          );
          await expect(page.locator('button[aria-label="Move FAQ 1 up"]')).toBeDisabled();
        },
      );

      const googleCategory = 'Arts & Entertainment > Party & Celebration > Party Supplies';
      await capture.type('hp-20', 'Enter the Google product category', await intoView(googleCategoryField(page)), googleCategory);
      const noindexSwitch = await intoView(page.getByRole('switch', { name: /Hide from search engines/ }));
      await capture.step('hp-21', 'Turn on the noindex switch', noindexSwitch, async (el) => {
        await el.click();
        await expect(el).toBeChecked();
      });

      await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
      await capture.step(
        'hp-22',
        'Submit the subcategory',
        page.getByRole('button', { name: 'Create Category' }),
        async (el) => {
          await el.click();
          await expect(page.getByText('Category created')).toBeVisible({ timeout: 30_000 });
          await page.waitForURL('**/categories');
          await waitForCategoryRows(page);
          await expect(categoryRow(page, childName).locator('[data-depth="1"]')).toHaveCount(1);
          await expect(countCell(page, parentName)).toHaveText('0 · 0 total');
        },
      );
      childId = await categoryIdFromRow(page, childName);

      // ── hp-23: the SEO content round-trips ───────────────────────────────────────────
      await capture.step('hp-23', 'Re-open the subcategory and verify every SEO field', null, async () => {
        await openCategoryEdit(page, childName);
        await expect(parentPicker(page)).toHaveValue(parentId as string);
        await expect(seoField(page, 'Meta Title', 'input')).toHaveValue(metaTitle);
        await expect(seoField(page, 'Meta Description', 'textarea')).toHaveValue(metaDescription);
        await expect(seoField(page, 'Intro text', 'textarea')).toHaveValue(intro);
        await expect(seoField(page, 'Body text', 'textarea')).not.toHaveValue('');
        await expect(googleCategoryField(page)).toHaveValue(googleCategory);
        await expect(page.locator('[data-testid="faq-row"]')).toHaveCount(2);
        await expect(page.locator('[aria-label="FAQ 1 question"]')).toHaveValue('What is the minimum order?');
        await expect(page.getByRole('switch', { name: /Hide from search engines/ })).toBeChecked();
      });

      // ── alt-14 / alt-15: slug-change warning, on the same edit form, never saved ─────
      await capture.step(
        'alt-14',
        "Change the subcategory's slug and read the warning",
        slugField(page),
        async (el) => {
          await el.fill(`qa-child-${runId}-renamed`);
          const warning = page.locator('[data-testid="slug-warning"]');
          await expect(warning).toBeVisible();
          await expect(warning).toHaveAttribute('role', 'alert');
          await expect(warning).toContainText(`/products/qa-child-${runId} becomes /products/qa-child-${runId}-renamed`);
          await expect(warning).toContainText('Existing links and search rankings will break.');
        },
      );
      await capture.step('alt-15', 'Restore the original slug', slugField(page), async (el) => {
        await el.fill(`qa-child-${runId}`);
        await expect(page.locator('[data-testid="slug-warning"]')).toHaveCount(0);
      });

      // ── alt-17: a childless category's picker excludes only itself ───────────────────
      await capture.step(
        'alt-17',
        "Confirm the subcategory's own parent picker excludes itself",
        parentPicker(page),
        async (el) => {
          const options = (await el.locator('option').allInnerTexts()).map((t) => t.trim());
          expect(options).not.toContain(childName);
          expect(options).toContain(parentName);
          expect(options).toContain('Marketing Prints');
        },
      );

      // ── alt-16 + edge-02 + edge-03, on the parent's edit form. Nothing is saved. ─────
      await openCategoryEdit(page, parentName);

      await capture.step(
        'alt-16',
        'Inspect the parent picker on a category that already has subcategories',
        parentPicker(page),
        async (el) => {
          await expect(el).toBeDisabled();
          await expect(
            page.getByText('This category has subcategories, so it must stay top-level.'),
          ).toBeVisible();
        },
      );

      const longMetaTitle = 'A'.repeat(70);
      await capture.step(
        'edge-02',
        'Enter a meta title longer than the 60-character guideline',
        await intoView(seoField(page, 'Meta Title', 'input')),
        async (el) => {
          await el.fill(longMetaTitle);
          const counter = seoCounter(page, 'Meta Title');
          await expect(counter).toHaveText('70/60');
          // Advisory, not validation: CharCount only recolours, the Zod schema has no max here.
          await expect(counter).toHaveClass(/text-destructive/);
        },
      );

      await capture.step(
        'edge-03',
        'Enter intro copy past the hard 2000-character limit and try to save',
        await intoView(seoField(page, 'Intro text', 'textarea')),
        async (el) => {
          await el.fill('B'.repeat(2001));
          await page.getByRole('button', { name: 'Save Changes' }).scrollIntoViewIfNeeded();
          await page.getByRole('button', { name: 'Save Changes' }).click();
          await expect(page.getByText('Max 2000 characters')).toBeVisible({ timeout: 10_000 });
          await expect(page.getByText('Category updated')).toHaveCount(0);
        },
      );

      // ── err-02 + edge-01: FAQ validation and the 20-row cap, on a freshly loaded form ─
      await openCategoryEdit(page, parentName);

      await capture.step('err-02', 'Add an empty FAQ row and try to save', await intoView(addFaqButton(page)), async (el) => {
        await el.click();
        await page.getByRole('button', { name: 'Save Changes' }).scrollIntoViewIfNeeded();
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Question is required')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Answer is required')).toBeVisible();
        await expect(page.getByText('Category updated')).toHaveCount(0);
      });

      await capture.step('edge-01', 'Add FAQ rows up to the 20-row cap', await intoView(addFaqButton(page)), async (el) => {
        for (let i = 1; i < 20; i += 1) await el.click();
        await expect(page.locator('[data-testid="faq-row"]')).toHaveCount(20);
        await expect(el).toContainText('(20/20)');
        await expect(el).toBeDisabled();
      });

      // ── alt-01..alt-03: product form's grouped category select. Never submitted. ─────
      await capture.step('alt-01', "Open the new-product form and inspect the Category select", null, async () => {
        await page.goto('/products/new');
        const select = page.locator('select[name="category_id"]');
        await expect(select.locator('optgroup')).not.toHaveCount(0, { timeout: 30_000 });
        await expect(select.locator('optgroup[label="Marketing Prints"]')).toHaveCount(1);
        await expect(
          select.locator('optgroup[label="Marketing Prints"] option', {
            hasText: 'Marketing Prints > Posters',
          }),
        ).toHaveCount(1);
        await expect(
          select.locator('optgroup[label="Marketing Prints"] option', {
            hasText: 'Marketing Prints (top level)',
          }),
        ).toHaveCount(1);
        // A childless top-level category stays a plain option, not a group.
        await expect(select.locator('optgroup[label="Business Cards"]')).toHaveCount(0);
      });

      const productCategorySelect = page.locator('select[name="category_id"]');
      await capture.step(
        'alt-02',
        'Select a parent category that has subcategories',
        productCategorySelect,
        async (el) => {
          await el.selectOption({ label: 'Marketing Prints (top level)' });
          const warning = page.locator('[data-testid="parent-category-warning"]');
          await expect(warning).toBeVisible();
          await expect(warning).toContainText('This category has subcategories.');
        },
      );

      await capture.step('alt-03', 'Switch the selection to one of its subcategories', productCategorySelect, async (el) => {
        await el.selectOption({ label: 'Marketing Prints > Posters' });
        await expect(page.locator('[data-testid="parent-category-warning"]')).toHaveCount(0);
      });

      // ── alt-04..alt-07: products list category filter rolls up descendants ──────────
      await capture.step('alt-04', 'Open the products list and read a product\'s category path', null, async () => {
        await page.goto('/products');
        await waitForProductRows(page);
        await expect(page.locator('tbody tr', { hasText: 'A5 Flyers' })).toContainText(
          'Marketing Prints > Flyers & Leaflets',
        );
        await expect(page.locator('tbody tr', { hasText: 'Custom Die-Cut Stickers' })).toContainText(
          'Stickers & Labels > Die-cut Stickers',
        );
      });

      const categoryFilter = page.locator('[data-slot="select-trigger"]').nth(1);
      await capture.step('alt-05', 'Filter the list by the parent category "Marketing Prints"', categoryFilter, async () => {
        await chooseSelectItem(page, categoryFilter, 'Marketing Prints');
        await page.waitForTimeout(1_000);
        await waitForProductRows(page);
        const names = (await page.locator('tbody tr td a[href^="/products/"]').allInnerTexts()).map((t) => t.trim());
        // Marketing Prints has 0 direct products; these two come from its subcategories.
        expect(names).toContain('A5 Flyers');
        expect(names).toContain('A2 Posters');
        expect(names).not.toContain('Custom Die-Cut Stickers');
      });

      await capture.step('alt-06', 'Read the filter trigger\'s own label', categoryFilter, async (el) => {
        await expect(el).toContainText('Marketing Prints');
        await expect(el).not.toContainText('50029');
      });

      await capture.step(
        'alt-07',
        'Filter by the "Stickers & Labels > Die-cut Stickers" subcategory instead',
        categoryFilter,
        async () => {
          await chooseSelectItem(page, categoryFilter, 'Stickers & Labels > Die-cut Stickers');
          await page.waitForTimeout(1_000);
          await waitForProductRows(page);
          const names = (await page.locator('tbody tr td a[href^="/products/"]').allInnerTexts()).map((t) => t.trim());
          expect(names).toEqual(['Custom Die-Cut Stickers']);
        },
      );
      await chooseSelectItem(page, categoryFilter, 'All categories');
      await page.waitForTimeout(1_000);
      await waitForProductRows(page);

      // ── alt-08..alt-11: bulk move dialog, driven to confirm and then cancelled ───────
      // The confirm button is NEVER clicked: no existing product may change category in this
      // run (the real move was verified live beforehand).
      let bulkMoveRequests = 0;
      page.on('request', (req) => {
        if (req.url().includes('/admin/products/bulk-category')) bulkMoveRequests += 1;
      });

      const flyerRow = page.locator('tbody tr', { hasText: 'A5 Flyers' });
      await capture.step(
        'alt-08',
        'Select one product and open the bulk "Move to category…" action',
        await intoView(flyerRow.locator('[aria-label="Select row"]')),
        async (el) => {
          await el.click();
          const moveButton = page.getByRole('button', { name: 'Move to category…' });
          await expect(moveButton).toBeVisible();
          await moveButton.click();
          await expect(page.getByText('Choose the category 1 selected product will move to.')).toBeVisible();
        },
      );

      const targetSelect = page.locator('select#bulk-move-target');
      await capture.step('alt-09', 'Pick a target category that has subcategories', targetSelect, async (el) => {
        await el.selectOption({ label: 'Stickers & Labels (top level)' });
        const warning = page.locator('[data-testid="parent-category-warning"]');
        await expect(warning).toBeVisible();
        await expect(warning).toContainText('Prefer the most specific subcategory.');
      });

      await capture.step('alt-10', 'Pick the subcategory and continue to the confirmation step', targetSelect, async (el) => {
        await el.selectOption({ label: 'Stickers & Labels > Die-cut Stickers' });
        await expect(page.locator('[data-testid="parent-category-warning"]')).toHaveCount(0);
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(
          page.getByText('Move 1 product to "Stickers & Labels > Die-cut Stickers"?'),
        ).toBeVisible();
        await expect(page.locator('[data-testid="move-confirm"]')).toContainText(
          'Product page URLs change to the new category.',
        );
        await expect(page.getByRole('button', { name: 'Move 1 product' })).toBeVisible();
      });

      await capture.step(
        'alt-11',
        'Back out of the confirmation and close the dialog without moving anything',
        page.getByRole('button', { name: 'Back' }),
        async (el) => {
          await el.click();
          await expect(targetSelect).toBeVisible();
          await page.getByRole('button', { name: 'Cancel' }).click();
          await expect(page.locator('select#bulk-move-target')).toHaveCount(0);
          expect(bulkMoveRequests).toBe(0);
        },
      );

      // ── alt-12 / alt-13: nav-link picker shows full paths. Never saved. ──────────────
      await capture.step('alt-12', 'Open Content > Navigation and start a new header link', null, async () => {
        await page.goto('/content/navigation');
        const addLink = page.getByRole('button', { name: 'Add Link' });
        await expect(addLink).toBeVisible({ timeout: 30_000 });
        await addLink.click();
        await expect(page.getByText('New Header Link')).toBeVisible();
      });

      const navTargetTrigger = await intoView(page.locator('[data-slot="select-trigger"]').last());
      await capture.step('alt-13', 'Open the category picker and read its option labels', navTargetTrigger, async () => {
        const labels = await selectItemLabels(page, navTargetTrigger);
        expect(labels).toContain('Marketing Prints > Posters');
        expect(labels).toContain('Marketing Prints > Flyers & Leaflets');
        expect(labels).toContain('Stickers & Labels > Die-cut Stickers');
        expect(labels).toContain(`${parentName} > ${childName}`);
        // Tree order: a parent is always immediately followed by its own children.
        expect(labels.indexOf('Marketing Prints > Posters')).toBeGreaterThan(labels.indexOf('Marketing Prints'));
      });

      // ── err-03..err-05: server-side tree guards, over the authenticated API ──────────
      expect(bearer, 'no bearer token was observed on any API request').not.toBeNull();
      expect(parentId, 'parent category id was never captured').not.toBeNull();
      expect(childId, 'child category id was never captured').not.toBeNull();

      const patchParent = (id: string, parent: number) =>
        page.request.patch(`${API}/admin/categories/${id}`, {
          headers: { authorization: bearer as string, 'content-type': 'application/json' },
          data: { parent_id: parent },
          failOnStatusCode: false,
        });
      const readCategory = async (id: string) => {
        const res = await page.request.get(`${API}/admin/categories/${id}`, {
          headers: { authorization: bearer as string },
        });
        return (await res.json()).data;
      };

      await capture.step('err-03', 'Ask the backend to re-parent a category under its own child', null, async () => {
        const res = await patchParent(parentId as string, Number(childId));
        expect(res.status()).toBe(422);
        expect((await res.json()).message).toBe('Parent would create a cycle in the category tree');
        expect(await readCategory(parentId as string)).toMatchObject({ parent_id: null });
      });

      await capture.step('err-04', 'Ask the backend to make a category its own parent', null, async () => {
        const res = await patchParent(childId as string, Number(childId));
        expect(res.status()).toBe(422);
        expect((await res.json()).message).toBe('A category cannot be its own parent');
        expect(String((await readCategory(childId as string)).parent_id)).toBe(parentId);
      });

      await capture.step('err-05', 'Ask the backend to nest three levels deep', null, async () => {
        // 50029 = Marketing Prints, an existing top-level category. The QA parent has a child,
        // so this would put that child at depth 2 — one past MAX_CATEGORY_DEPTH.
        const res = await patchParent(parentId as string, 50029);
        expect(res.status()).toBe(422);
        expect((await res.json()).message).toBe(
          'A category with subcategories cannot become a subcategory (max depth 2)',
        );
        expect(await readCategory(parentId as string)).toMatchObject({ parent_id: null });
      });

      // ── err-01: deleting a parent that still has a child is rejected with a 409 ──────
      await page.goto('/categories');
      await waitForCategoryRows(page);
      await categoryRow(page, parentName).locator('button').last().click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(
        page.getByText(
          `"${parentName}" has 1 subcategory. Move or delete its subcategories first, otherwise the delete will be rejected.`,
        ),
      ).toBeVisible({ timeout: 10_000 });

      await capture.step(
        'err-01',
        'Confirm the delete anyway and read the rejection',
        page.getByRole('button', { name: 'Delete Category' }),
        async (el) => {
          await el.click();
          await expect(
            page.getByText(
              `"${parentName}" still has subcategories. Move or delete its subcategories first.`,
            ),
          ).toBeVisible({ timeout: 30_000 });
          await waitForCategoryRows(page);
          await expect(categoryRow(page, parentName)).toHaveCount(1);
          await expect(categoryRow(page, childName)).toHaveCount(1);
        },
      );

      // ── edge-04 / edge-05: cleanup, child first then the now-childless parent ────────
      await capture.step('edge-04', 'Delete the subcategory', null, async () => {
        await deleteCategoryRow(page, childName);
        await expect(page.getByText(`"${childName}" deleted`)).toBeVisible({ timeout: 30_000 });
        await expect(categoryRow(page, childName)).toHaveCount(0);
      });

      await capture.step('edge-05', 'Delete the now-childless parent category', null, async () => {
        await deleteCategoryRow(page, parentName);
        await expect(page.getByText(`"${parentName}" deleted`)).toBeVisible({ timeout: 30_000 });
        await expect(categoryRow(page, parentName)).toHaveCount(0);
        // The tree is back exactly as it was found.
        await expect(countCell(page, 'Marketing Prints')).toHaveText('0 · 2 total');
        await expect(countCell(page, 'Stickers & Labels')).toHaveText('1 · 2 total');
      });
    } finally {
      // Safety net: if an assertion above threw before the cleanup steps ran, the two QA
      // categories must still go. Child first — the parent's delete 409s otherwise.
      for (const name of [childName, parentName]) {
        try {
          await page.goto('/categories');
          await waitForCategoryRows(page).catch(() => {});
          if ((await categoryRow(page, name).count()) === 0) continue;
          await deleteCategoryRow(page, name);
          await expect(page.getByText(`"${name}" deleted`)).toBeVisible({ timeout: 30_000 });
        } catch {
          // Surfaced by the post-run leftover check rather than masking the original failure.
        }
      }
    }
  });
});
