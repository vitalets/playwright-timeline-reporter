import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  // fullyParallel: true,
  workers: 3,
  reporter: [['../../../dist/index.js', { debug: true }]],
});
