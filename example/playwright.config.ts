import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Resolve test paths when merging reports from different operating systems.
  testDir: '.',
  workers: 3,
  // In a real project use 'playwright-timeline-reporter'.
  reporter: [['../dist/index.js', { markdownFile: true, markdownCI: true }], ['dot'], ['blob']],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'Project 1',
    },
    {
      name: 'Project 2',
    },
  ],
});
