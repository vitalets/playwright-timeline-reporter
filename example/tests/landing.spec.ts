import { test, delay } from './fixtures.js';
import { expect } from '@playwright/test';

test.beforeAll(async ({ browser }) => {
  // Setup: warm up browser cache
  await delay(180);
  const page = await browser.newPage();
  await page.goto('/', { timeout: 10000 });
  await delay(220);
  await page.close();
});

test.afterAll(async () => {
  // Cleanup
  await delay(100);
});

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    await delay(150);
  });

  test('renders hero content', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
    await delay(120);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
    await delay(180);
    const heading = await page.locator('.hero__title').textContent({ timeout: 5000 });
    expect(heading).toBeTruthy();
  });

  test('renders navigation menu', async ({ page }) => {
    await delay(100);
    await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });
    await delay(200);
    const links = await page.locator('nav a').count();
    expect(links).toBeGreaterThan(0);
  });

  test('displays Get Started button', async ({ page }) => {
    await delay(150);
    const button = page.getByRole('link', { name: /get started/i }).first();
    await expect(button).toBeVisible({ timeout: 5000 });
    await delay(250);
  });

  test(
    'navigates to docs on button click',
    { tag: ['@navigation', '@regression'] },
    async ({ page, sharedBrowserState }) => {
      await delay(200);
      await page
        .getByRole('link', { name: /get started/i })
        .first()
        .click({ timeout: 5000 });
      await delay(300);
      await expect(page).toHaveURL(/.*docs.*/i, { timeout: 5000 });
    },
  );
});
