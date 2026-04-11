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
    },
    {
      name: 'firefox',
    },
    {
      name: 'webkit',
    },
    {
      name: 'Mobile Chrome',
    },
    {
      name: 'Mobile Safari',
    },
  ],
});
