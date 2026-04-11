import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  workers: 4,
  reporter: [['../../../dist/index.js', { debug: true }]],
});
