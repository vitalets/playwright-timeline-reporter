import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  reporter: [
    [
      '../../dist/reporter.js',
      {
        outputFile: './test/report/timeline-report/index.html',
      },
    ],
  ],
});
