import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  workers: 2,
});
