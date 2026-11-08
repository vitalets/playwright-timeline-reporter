import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 1,
  reporter: [
    [
      '../../../dist/index.js',
      {
        markdownFile: process.env.MARKDOWN_ENABLED === '1',
        markdownCI: process.env.MARKDOWN_CI_ENABLED === '1',
      },
    ],
  ],
});
