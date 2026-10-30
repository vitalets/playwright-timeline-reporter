import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  workers: 1,
  outputDir: './out',
  reporter: [
    [
      './reporter.js',
      {
        outputFile: process.env.HTML_OUTPUT_FILE,
        markdown: process.env.MARKDOWN_OUTPUT_FILE,
      },
    ],
  ],
});
