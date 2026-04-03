import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  // in case of more workers there can be flacky tests because of small durations.
  workers: 2,
  reporter: [['./reporter.ts']],
});
