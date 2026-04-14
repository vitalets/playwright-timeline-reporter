import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  workers: 2,
  reporter: [['dot'], ['../../../dist/index.js']],
});
