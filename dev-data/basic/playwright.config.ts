import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Uncomment after moving to ESM
// import { fileURLToPath } from 'url';
// const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

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
