import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  reporter: [['./reporter.ts']],
});
