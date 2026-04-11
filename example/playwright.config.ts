import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 3,
  // In a real project use 'playwright-timeline-reporter'.
  reporter: [['../dist/index.js'], ['dot'], ['blob']],
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
