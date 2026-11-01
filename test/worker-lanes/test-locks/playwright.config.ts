import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  workers: 2,
});
