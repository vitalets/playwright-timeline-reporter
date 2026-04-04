import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  reporter: [
    [
      `${projectRoot}/src/reporter.ts`,
      {
        outputFile: `${projectRoot}/src/report/with-projects-deps.tpl.html`,
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
