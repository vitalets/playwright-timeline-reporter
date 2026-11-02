import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 1,
  reporter: [
    [
      '../../../dist/index.js',
      {
        markdown: process.env.MARKDOWN_ENABLED === '1',
      },
    ],
  ],
});
