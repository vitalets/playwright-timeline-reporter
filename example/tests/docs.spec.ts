import { test, delay } from './fixtures';
import { expect } from '@playwright/test';

// beforeAll hook with intentional error (element not found)
test.beforeAll(async ({ browser }) => {
  await delay(120);
  const page = await browser.newPage();
  await page.goto('/docs/intro', { timeout: 10000 });
  // This will fail - looking for non-existent element
  await page.waitForSelector('#non-existent-docs-header', { timeout: 1000 });
  await page.close();
});

test.describe('Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await delay(100);
  });

  test(
    'displays documentation sidebar',
    { tag: ['@smoke', '@docs', '@ui'] },
    async ({ docsPage }) => {
      await delay(150);
      const sidebar = docsPage.locator('aside[class*="sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 2000 });
      await delay(180);
    },
  );

  test(
    'navigates between doc pages',
    { tag: ['@docs', '@navigation'] },
    async ({ docsPage, sharedBrowserState }) => {
      await delay(200);
      const link = docsPage
        .locator('nav a')
        .filter({ hasText: /installation/i })
        .first();
      const isLinkVisible = await link.isVisible({ timeout: 2000 }).catch(() => false);
      if (isLinkVisible) {
        await link.click({ timeout: 5000 });
        await delay(250);
        await expect(docsPage).toHaveURL(/.*installation.*/i, { timeout: 5000 });
      }
    },
  );

  test('shows table of contents', async ({ docsPage }) => {
    await delay(120);
    const toc = docsPage.locator('[class*="toc"]').first();
    await delay(200);
    // TOC might not always be present, so we just check without failing
    if (await toc.isVisible({ timeout: 1000 }).catch(() => false)) {
      expect(await toc.textContent()).toBeTruthy();
    }
  });
});
