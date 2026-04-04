import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  fullyParallel: true,
  reporter: [
    [
      `${projectRoot}/src/reporter.ts`,
      {
        outputFile: `${projectRoot}/src/report/with-basic-data.tpl.html`,
      },
    ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
});
