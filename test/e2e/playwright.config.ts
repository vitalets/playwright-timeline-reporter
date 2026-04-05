import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  reporter: [
    [
      '../../src/reporter.ts',
      {
        outputFile: './test/report/timeline-report/index.html',
      },
    ],
  ],
});
