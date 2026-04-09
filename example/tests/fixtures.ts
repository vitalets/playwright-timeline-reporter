import { test as base, Page, BrowserContext } from '@playwright/test';

type TestFixtures = {
  docsPage: Page;
  apiPage: Page;
  communityPage: Page;
  authenticatedPage: Page;
  failingTestFixture: void;
  failingTestFixtureWithDelay: void;
};

type WorkerFixtures = {
  authenticatedContext: BrowserContext;
  sharedBrowserState: void;
  failingWorkerFixture: void;
  failingWorkerFixtureWithDelay: void;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker fixture: fake authentication context with initialization delay
  authenticatedContext: [
    async ({ browser }, use) => {
      // Simulate authentication setup time
      await delay(300);
      const context = await browser.newContext({
        extraHTTPHeaders: {
          'X-Fake-Auth': 'authenticated-user-token',
        },
      });
      await use(context);
      await delay(100);
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Worker fixture: shared browser state initialization
  sharedBrowserState: [
    async ({}, use) => {
      // Simulate loading shared resources, cache warming, etc.
      await delay(250);
      await use();
      // Cleanup
      await delay(150);
    },
    { scope: 'worker' },
  ],

  // Test fixture: page pre-navigated to docs section
  docsPage: async ({ page }, use) => {
    await delay(100); // Simulate setup time
    await page.goto('/docs/intro', { timeout: 10000 });
    await delay(200); // Simulate page load time
    await use(page);
    await delay(50); // Cleanup delay
  },

  // Test fixture: page pre-navigated to API section
  apiPage: async ({ page }, use) => {
    await delay(120);
    await page.goto('/docs/api/class-playwright', { timeout: 10000 });
    await delay(180);
    await use(page);
    await delay(50);
  },

  // Test fixture: page pre-navigated to community section
  communityPage: async ({ page }, use) => {
    await delay(90);
    await page.goto('/community/welcome', { timeout: 10000 });
    await delay(160);
    await use(page);
    await delay(50);
  },

  // Test fixture: authenticated page (uses worker fixture)
  authenticatedPage: async ({ authenticatedContext }, use) => {
    await delay(80);
    const page = await authenticatedContext.newPage();
    await delay(150);
    await use(page);
    await page.close();
  },

  failingTestFixture: async ({}, use) => {
    throw new Error('Intentional error in test fixture');
    await use();
  },

  failingTestFixtureWithDelay: async ({}, use) => {
    await delay(200);
    throw new Error('Intentional error in test fixture');
    await use();
  },

  failingWorkerFixture: [
    async ({}, use) => {
      throw new Error('Intentional error in worker fixture');
      await use();
    },
    { scope: 'worker' },
  ],

  failingWorkerFixtureWithDelay: [
    async ({}, use) => {
      await delay(300);
      throw new Error('Intentional error in worker fixture');
      await use();
    },
    { scope: 'worker' },
  ],
});

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
