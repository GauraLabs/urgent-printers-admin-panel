import { test, expect } from '../capture.js';

// Native 4K plates at a readable CSS viewport; zooms retain detail in both exports.
test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 4,
  captureOptions: { feature: 'Coupon Creation', axe: 'per-navigation', lighthouse: 'off', preActionScreenshots: true } });

test('coupon creation tutorial — real form, inactive demonstration coupon', async ({ page, capture }) => {
  test.setTimeout(180_000);
  await page.goto('/login');
  await page.locator('#email').fill(process.env.QA_ADMIN_EMAIL ?? 'admin@urgentprinters.com');
  await page.locator('#password').fill(process.env.QA_ADMIN_PASSWORD ?? (() => { throw new Error("Set QA_ADMIN_PASSWORD before recording tutorials"); })());
  const loginResponse = page.waitForResponse(r => r.url().includes('/admin/auth/login') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const login = await loginResponse;
  const loginBody = await login.json();
  const token = (loginBody.data ?? loginBody).access_token;
  const api = new URL(login.url()).origin + new URL(login.url()).pathname.replace(/\/admin\/auth\/login$/, '');
  const headers = { Authorization: `Bearer ${token}` };
  await page.waitForURL('**/dashboard');
  // Keep development tooling and transient notifications out of the footage.
  await page.addStyleTag({ content: 'nextjs-portal, [data-sonner-toaster] { display:none!important } main form { padding-bottom:350px }' });
  // Replay only replaces this exact inactive, unused demonstration record.
  const listResponse = await page.request.get(`${api}/admin/coupons?search=PRINT10-TUTORIAL`, { headers });
  expect(listResponse.ok()).toBeTruthy();
  const body = await listResponse.json();
  const items = Array.isArray(body.data) ? body.data : (body.data ?? body).items;
  for (const item of items.filter((c) => c.code === 'PRINT10-TUTORIAL')) {
    expect(item.description).toBe('10% off printing orders');
    expect(item.status).toBe('inactive');
    expect(Number(item.usage_count)).toBe(0);
    const removed = await page.request.delete(`${api}/admin/coupons/${item.id}`, { headers });
    expect(removed.ok()).toBeTruthy();
  }
  await page.getByRole('link', { name: 'Coupons', exact: true }).click();
  await expect(page.getByRole('link', { name: 'New Coupon' })).toBeVisible();
  await page.getByPlaceholder(/Search coupon/).fill('PRINT10-TUTORIAL');
  await expect(page.getByText('PRINT10-TUTORIAL', { exact: true })).toHaveCount(0);
  await capture.step('cp-01', 'Open Coupons from the sidebar', null, async () => {});
  await capture.step('cp-02', 'Choose New Coupon', page.getByRole('link', { name: 'New Coupon' }), async el => {
    await el.click(); await expect(page.getByPlaceholder('SAVE10')).toBeVisible();
  });
  const type = async (id, name, field, value) => {
    await field.scrollIntoViewIfNeeded();
    await capture.type(id, name, field, value);
  };
  await type('cp-03', 'Enter the customer-facing coupon code', page.getByLabel('Coupon Code *'), 'PRINT10-TUTORIAL');
  await type('cp-04', 'Add a clear description', page.getByLabel('Description', { exact: true }), '10% off printing orders');
  await capture.step('cp-05', 'Compare percentage and fixed-amount discount types', page.getByRole('combobox', { name: 'Type *' }), async el => {
    await el.click(); await expect(page.getByRole('option', { name: 'Fixed Amount (₹)' })).toBeVisible();
  });
  await page.getByRole('option', { name: 'Percentage (%)' }).click();
  await type('cp-06', 'Set the percentage discount', page.getByLabel('Value * (%)', { exact: true }), '10');
  await type('cp-07', 'Cap the discount at 200 rupees', page.getByLabel('Max Discount (₹)'), '200');
  await type('cp-08', 'Require a minimum eligible order value of 1000 rupees', page.getByLabel('Minimum Order (₹)'), '1000');
  await type('cp-09', 'Limit this coupon to 100 total redemptions', page.getByLabel('Total Usage Limit'), '100');
  await type('cp-10', 'Allow one redemption per customer', page.getByLabel('Per User Limit'), '1');
  const discounted = page.locator('label').filter({ hasText: 'Applies to items already on discount' }).getByRole('switch');
  await discounted.scrollIntoViewIfNeeded();
  await capture.step('cp-11', 'Exclude items that are already discounted', discounted, async el => {
    await el.click(); await expect(el).not.toBeChecked();
  });
  const specific = page.getByRole('radio', { name: 'Specific products or categories' });
  await specific.scrollIntoViewIfNeeded();
  await capture.step('cp-12', 'Show how product and category restrictions work', specific, async el => {
    await el.check(); await expect(page.locator('#scope-category-search')).toBeVisible();
  });
  await page.getByRole('radio', { name: 'All products', exact: true }).check();
  await capture.step('cp-13', 'Use all products for this example', page.getByTestId('scope-summary'), async el => {
    await expect(el).toHaveText('Applies to all products');
  });
  const date = page.getByLabel('Valid From *');
  await date.scrollIntoViewIfNeeded();
  await capture.step('cp-14', 'Review start date and optional expiry', date, async el => {
    await expect(el).not.toHaveValue('');
    await expect(page.getByLabel('Valid Until', { exact: true })).toHaveValue('');
  });
  const manual = page.getByRole('button', { name: /Manual only/ });
  await manual.scrollIntoViewIfNeeded();
  await capture.step('cp-15', 'Keep manual checkout entry and a public coupon', manual, async el => {
    await el.click();
    await expect(page.locator('label').filter({ hasText: 'Personal coupon' }).getByRole('switch')).not.toBeChecked();
  });
  const active = page.locator('label').filter({ hasText: 'Active (coupon is usable)' }).getByRole('switch');
  await active.scrollIntoViewIfNeeded();
  await capture.step('cp-16', 'Keep the demonstration coupon inactive', active, async el => {
    await el.click(); await expect(el).not.toBeChecked();
  });
  await capture.step('cp-17', 'Create the coupon and verify the saved row', page.getByRole('button', { name: 'Create Coupon', exact: true }), async el => {
    const responsePromise = page.waitForResponse(r => r.url().includes('/admin/coupons') && r.request().method() === 'POST');
    await el.click(); const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    await page.waitForURL('**/coupons');
    await page.getByPlaceholder(/Search coupon/).fill('PRINT10-TUTORIAL');
    const row = page.getByRole('row').filter({ hasText: 'PRINT10-TUTORIAL' });
    await expect(row).toBeVisible(); await expect(row.getByText('Inactive', { exact: true })).toBeVisible();
    await expect(row).toContainText('10%(max ₹200)');
  });
  await capture.step('cp-18', 'Confirm discount, conditions and inactive status in the list', null, async () => {
    await expect(page.getByRole('row').filter({ hasText: 'PRINT10-TUTORIAL' })).toContainText('₹1,000');
  });
});
