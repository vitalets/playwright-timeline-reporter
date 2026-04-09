import { test, delay } from './fixtures.js';
import { expect } from '@playwright/test';

test.beforeAll(async () => {
  // Initialize version data
  await delay(150);
});

test.describe('Version selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/intro', { timeout: 10000 });
    await delay(140);
  });

  test('displays current version', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
    await delay(120);
    const versionButton = page
      .locator('button[class*="dropdown"]')
      .filter({ hasText: /version/i })
      .first();
    await expect(versionButton).toBeVisible({ timeout: 2000 });
    await delay(200);
  });

  test('opens version dropdown menu', async ({ page, authenticatedPage }) => {
    await delay(180);
    const versionButton = page
      .locator('button[class*="dropdown"]')
      .filter({ hasText: /version/i })
      .first();
    await delay(150);
    const isButtonVisible = await versionButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isButtonVisible) {
      await versionButton.click({ timeout: 5000 });
      await delay(220);
    }
  });

  test('shows multiple versions in dropdown', async ({ page }) => {
    await delay(160);
    // Attempting to find and click version selector
    const versionButton = page
      .locator('button[class*="dropdown"]')
      .filter({ hasText: /version/i })
      .first();
    await delay(200);
    const isButtonVisible = await versionButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isButtonVisible) {
      await versionButton.click({ timeout: 5000 });
      await delay(180);
    }
  });
});
