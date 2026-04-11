/**
 * Playwright config for generating dev data with project dependencies.
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
        outputFile: `${projectRoot}/src/report/with-projects-deps.tpl.html`,
        debug: true,
      },
    ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'auth',
      testMatch: /landing\.spec\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['auth'],
    },
  ],
});
