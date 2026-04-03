import { test, delay } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    await delay(120);
  });

  test.afterEach(async ({ page }) => {
    // Clear search state
    await delay(80);
  });

  test('opens search dialog', async ({ page }) => {
    await delay(100);
    await page.locator('button[class*="DocSearch"]').click({ timeout: 5000 });
    await delay(180);
    await expect(page.locator('.DocSearch-Modal')).toBeVisible({ timeout: 5000 });
    await delay(150);
  });

  test(
    'returns search results for valid query',
    { tag: ['@search', '@regression'] },
    async ({ page, sharedBrowserState }) => {
      await delay(120);
      await page.locator('button[class*="DocSearch"]').click({ timeout: 5000 });
      await delay(200);
      await page.locator('.DocSearch-Input').fill('test', { timeout: 5000 });
      await delay(250);
      const results = page.locator('.DocSearch-Hits');
      await expect(results).toBeVisible({ timeout: 3000 });
    },
  );

  test('fails to find non-existent element', async ({ page }) => {
    await delay(150);
    // This will intentionally fail - searching for element that doesn't exist
    await expect(page.locator('#non-existent-search-element')).toBeVisible({ timeout: 1000 });
  });

  test.describe('Keyboard', () => {
    test('handles keyboard navigation', { tag: ['@search', '@keyboard'] }, async ({ page }) => {
      await delay(130);
      await page.locator('button[class*="DocSearch"]').click({ timeout: 5000 });
      await delay(200);
      await page.keyboard.type('browser');
      await delay(280);
      await page.keyboard.press('ArrowDown');
      await delay(100);
    });
  });
});
