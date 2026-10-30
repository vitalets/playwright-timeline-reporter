import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 1,
  reporter: [
    [
      '../../../dist/index.js',
      {
        markdown: process.env.MARKDOWN_OUTPUT_FILE || process.env.MARKDOWN_ENABLED === '1',
        ...(process.env.HTML_OUTPUT_FILE && { outputFile: process.env.HTML_OUTPUT_FILE }),
      },
    ],
  ],
});
