import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  workers: 3,
  reporter: [
    // In a real project use: 'playwright-timeline-reporter' instead of '../dist/reporter'
    ['../dist/reporter'],
    ['blob'],
  ],
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
