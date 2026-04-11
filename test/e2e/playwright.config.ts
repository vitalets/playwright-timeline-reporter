import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  reporter: [['../../dist/index.js', { outputFile: './timeline-report/index.html' }]],
});
