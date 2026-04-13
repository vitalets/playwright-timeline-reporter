import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  workers: 3,
  reporter: [['../reporter.ts', { debug: true }]],
});
