import { defineConfig, devices } from '@playwright/test';
// In a real project use: 'playwright-timeline-reporter' instead of '../dist'
import { timelineReporter } from '../dist';

export default defineConfig({
  workers: 3,
  reporter: [timelineReporter(), ['dot'], ['blob']],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
