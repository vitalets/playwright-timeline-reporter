import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  workers: 2,
  reporter: [['../../dist/index.js', { outputFile: './timeline-report/index.html' }]],
});
