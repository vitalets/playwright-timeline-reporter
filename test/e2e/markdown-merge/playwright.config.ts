import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  workers: 1,
  outputDir: './out',
  reporter: [['./reporter.js']],
});
