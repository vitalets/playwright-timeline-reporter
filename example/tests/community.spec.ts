import { test, delay } from './fixtures.js';
import { expect } from '@playwright/test';

test.describe('Community', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/community/welcome', { timeout: 10000 });
    await delay(150);
  });

  test.afterEach(async () => {
    await delay(80);
  });

  test(
    'displays community welcome page',
    { tag: ['@smoke', '@community'] },
    async ({ communityPage }) => {
      await delay(130);
      const heading = communityPage.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 2000 });
      await delay(180);
    },
  );

  test('shows community links with auth context', async ({ authenticatedPage }) => {
    // This test uses the authenticated context fixture
    await delay(150);
    await authenticatedPage.goto('/community/welcome', { timeout: 10000 });
    await delay(200);
    const links = await authenticatedPage.locator('a').count();
    expect(links).toBeGreaterThan(0);
  });

  test(
    'fails to find community member profiles',
    { tag: ['@community', '@regression'] },
    async ({ page }) => {
      // Intentional error - looking for element that doesn't exist
      await delay(120);
      await page.goto('/community/welcome', { timeout: 10000 });
      await delay(160);
      await expect(page.locator('#community-member-profiles-section')).toBeVisible({
        timeout: 300,
      });
    },
  );

  test('displays community resources', async ({ communityPage }) => {
    await delay(140);
    const content = communityPage.locator('main').first();
    await expect(content).toBeVisible({ timeout: 5000 });
    await delay(200);
  });
});
