/**
 * Playwright config for generating dev data with no projects (fullyParallel single run).
 */
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  fullyParallel: true,
  reporter: [
    ['dot'],
    [
      `${projectRoot}/src/index.ts`,
      {
        outputFile: `${projectRoot}/src/report/with-no-projects.tpl.html`,
        debug: true,
      },
    ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
});
