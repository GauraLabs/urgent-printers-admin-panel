// Hand-authored — see pipeline/README.md's "Known infra findings" for why the MCP-driven
// Generator agent isn't in use yet.
import { test, expect } from '../capture.js';

async function login(page) {
  await page.goto('/login');
  await page.locator('#email').fill('admin@urgentprinters.com');
  await page.locator('#password').fill('SuperAdmin@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

const nameField = (page) => page.locator('label:text-is("Name *")').locator('xpath=following-sibling::input[1]');
const slugField = (page) => page.locator('label:text-is("Slug *")').locator('xpath=following-sibling::input[1]');
// Meta Title/Description labels sit inside an extra flex wrapper div alongside their char
// counter (CategoryForm.tsx), unlike Name/Slug — the input/textarea is a sibling of that
// wrapper, not of the label itself, hence the extra `..` to climb to the wrapper first.
const metaTitleField = (page) => page.locator('label:text-is("Meta Title")').locator('xpath=../following-sibling::input[1]');
const metaDescField = (page) => page.locator('label:text-is("Meta Description")').locator('xpath=../following-sibling::textarea[1]');
const IMAGE_FIXTURE = 'node_modules/@remotion/studio-server/web/coding-agent-icons/claude-code.png';

async function openEditFor(page, name) {
  const row = page.locator('tr', { hasText: name });
  await row.locator('button').last().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.waitForURL('**/categories/*');
}

test.describe('Category Management — edge-04/edge-05 malformed slug + meta overflow', () => {
  test.use({
    captureOptions: {
      feature: 'Category Management Edge Malformed Slug Meta Overflow',
      plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
      axe: 'off',
      lighthouse: 'off',
    },
  });

  test('a manually-entered malformed slug and over-length meta fields are both accepted, not blocked', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, () => login(page));

    const uniqueName = `QA Edge0405 ${Date.now()}`;
    const malformedSlug = `QA Edge0405 Slug!! ${Date.now()}`;
    const longMetaTitle = 'X'.repeat(90); // over the 60-char counter threshold
    const longMetaDesc = 'Y'.repeat(220); // over the 160-char counter threshold

    await capture.step('set-01', 'Open the new-category form and fill Name', null, async () => {
      await page.goto('/categories/new');
      await nameField(page).fill(uniqueName);
    });

    await capture.step('edg-01', 'Manually overwrite the auto-derived Slug with spaces/uppercase/symbols (plan edge-04)', slugField(page), async (el) => {
      await el.fill('');
      await el.fill(malformedSlug);
      await expect(el).toHaveValue(malformedSlug);
    });

    await capture.step('edg-02', 'Enter Meta Title/Description beyond their char-count thresholds (plan edge-05)', null, async () => {
      await metaTitleField(page).fill(longMetaTitle);
      await metaDescField(page).fill(longMetaDesc);
      await expect(page.getByText(`${longMetaTitle.length}/60`)).toBeVisible();
      await expect(page.getByText(`${longMetaDesc.length}/160`)).toBeVisible();
    });

    await capture.step('set-02', 'Upload one image (required to submit)', null, async () => {
      const imageInput = page.locator('input[type="file"][accept*="image"]');
      await imageInput.setInputFiles(IMAGE_FIXTURE);
      await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 20_000 });
    });

    await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
    await capture.step(
      'sub-01',
      'Submit with the malformed slug and over-length meta fields still in place',
      page.getByRole('button', { name: 'Create Category' }),
      async (el) => {
        await el.click();
        // Both are expected to be ACCEPTED per the plan's grounding (no client or server
        // validation blocks either) — a validation error here would itself be a finding.
        await expect(page.getByText('Category created')).toBeVisible({ timeout: 10_000 });
        await page.waitForURL('**/categories');
      },
    );

    await capture.step('chk-01', 'Confirm the saved category round-trips the exact values entered, unmodified', null, async () => {
      await openEditFor(page, uniqueName);
      await expect(slugField(page)).toHaveValue(malformedSlug);
      await expect(metaTitleField(page)).toHaveValue(longMetaTitle);
      await expect(metaDescField(page)).toHaveValue(longMetaDesc);
    });

    // Clean up the test category so it doesn't linger in the real catalog.
    await capture.step('del-01', 'Delete the test category created for this edge-case check', null, async () => {
      await page.goto('/categories');
      const row = page.locator('tr', { hasText: uniqueName });
      await row.locator('button').last().click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Delete Category' }).click();
      await expect(page.locator('tr', { hasText: uniqueName })).toHaveCount(0, { timeout: 10_000 });
    });
  });
});

test.describe('Category Management — edge-06 reorder boundaries', () => {
  test.use({
    captureOptions: {
      feature: 'Category Management Edge Reorder Boundaries',
      plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
      axe: 'off',
      lighthouse: 'off',
    },
  });

  test('clicking Up on the first row and Down on the last row is a safe no-op (plan edge-06)', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, () => login(page));
    await capture.step('nav-01', 'Open the categories list', null, () => page.goto('/categories'));

    let namesBefore;
    await capture.step('chk-01', 'Record the current order', null, async () => {
      namesBefore = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    });

    await capture.step('edg-01', 'Click Up on the first row', null, async () => {
      const firstRowUp = page.locator('tbody tr').first().locator('td').first().locator('button').first();
      await firstRowUp.click();
      await page.waitForTimeout(500);
    });

    await capture.step('chk-02', 'Confirm order is unchanged after Up on the first row', null, async () => {
      const namesAfterUp = await page.locator('tbody tr td:nth-child(2)').allTextContents();
      expect(namesAfterUp).toEqual(namesBefore);
    });

    await capture.step('edg-02', 'Click Down on the last row', null, async () => {
      const lastRowDown = page.locator('tbody tr').last().locator('td').first().locator('button').last();
      await lastRowDown.click();
      await page.waitForTimeout(500);
    });

    await capture.step('chk-03', 'Confirm order is unchanged after Down on the last row', null, async () => {
      const namesAfterDown = await page.locator('tbody tr td:nth-child(2)').allTextContents();
      expect(namesAfterDown).toEqual(namesBefore);
    });
  });
});
