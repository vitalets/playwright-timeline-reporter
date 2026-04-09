import { defineConfig } from '@playwright/test';
// In a real project import from 'playwright-timeline-reporter'.
import { timelineReporter } from '..';

export default defineConfig({
  workers: 3,
  reporter: [timelineReporter(), ['dot'], ['blob']],
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
