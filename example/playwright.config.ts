import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: 3,
  reporter: [
    // In a real project use: timelineReporter() from 'playwright-timeline-reporter'.
    ['../dist/reporter.js'],
    ['dot'],
    ['blob'],
  ],
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
