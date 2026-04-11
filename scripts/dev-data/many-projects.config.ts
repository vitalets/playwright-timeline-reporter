/**
 * Playwright config for generating dev data with many browser projects.
 */
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  reporter: [
    ['dot'],
    [
      `${projectRoot}/src/index.ts`,
      {
        outputFile: `${projectRoot}/src/report/with-many-projects.tpl.html`,
        debug: true,
      },
    ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  // Use chromium in all projects to not hassle with browsers download.
  projects: [
    {
      name: 'chromium',
      // ...devices['Desktop Chrome'],
    },
    {
      name: 'firefox',
      // ...devices['Desktop Firefox'],
    },
    {
      name: 'webkit',
      // ...devices['Desktop Safari'],
    },
    {
      name: 'Mobile Chrome',
      // ...devices['Pixel 5'],
    },
    {
      name: 'Mobile Safari',
      // ...devices['iPhone 12'],
    },
  ],
});
