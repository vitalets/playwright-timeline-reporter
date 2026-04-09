import { defineConfig } from '@playwright/test';
import { timelineReporter } from '../../dist/index.js';

export default defineConfig({
  testDir: './specs',
  reporter: [timelineReporter({ outputFile: './timeline-report/index.html' })],
});
