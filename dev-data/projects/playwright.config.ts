import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Uncomment after moving to ESM
// import { fileURLToPath } from 'url';
// const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  reporter: [
    [
      `${projectRoot}/src/reporter.ts`,
      {
        outputFile: `${projectRoot}/src/report/with-projects.tpl.html`,
      },
    ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
