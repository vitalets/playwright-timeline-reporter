import { test, delay } from './fixtures.js';
import { expect } from '@playwright/test';

test.beforeAll(async () => {
  // Setup: prepare API documentation cache
  await delay(180);
});

test.beforeEach(async ({ page }) => {
  // Navigate to API docs before each test
  await delay(120);
});

test.afterEach(async ({ page }) => {
  // Capture screenshot on failure, clear state
  await delay(100);
});

test.afterAll(async () => {
  // Cleanup
  await delay(120);
});

test.describe('API Reference', () => {
  test('loads Playwright class page', { tag: ['@smoke', '@api'] }, async ({ apiPage }) => {
    await delay(150);
    await expect(apiPage.locator('h1').first()).toBeVisible({ timeout: 5000 });
    await delay(200);
    const heading = await apiPage.locator('h1').first().textContent({ timeout: 5000 });
    expect(heading).toContain('Playwright');
  });

  test('shows class methods list', { tag: ['@auth'] }, async ({ apiPage, authenticatedPage }) => {
    await delay(180);
    const methodsList = apiPage.locator('article').first();
    await expect(methodsList).toBeVisible({ timeout: 5000 });
    await delay(250);
  });

  test('navigates to specific method documentation', async ({ apiPage }) => {
    await delay(500);
    // Try to find and click a method link
    // await apiPage.locator('a[href*="#"]').first().click({ timeout: 1000 });
  });

  test('displays code examples', async ({ page }) => {
    await delay(140);
    await page.goto('/docs/api/class-page', { timeout: 10000 });
    await delay(220);
    const codeBlock = page.locator('pre code').first();
    await expect(codeBlock).toBeVisible({ timeout: 3000 });
    await delay(180);
  });
});

test('test without describe', async ({ apiPage }) => {
  await delay(500);
});
