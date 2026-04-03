import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // fullyParallel: true,
  workers: 3,
  reporter: [
    // In a real project use: 'playwright-timeline-reporter' instead of '../dist/reporter'
    ['../dist/reporter'],
    ['list'],
    ['html', { open: 'never' }],
    process.argv.includes('merge-reports') ? ['null'] : ['blob'],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'auth',
    //   use: { ...devices['Desktop Chrome'] },
    //   testMatch: /landing\.spec\.ts/,
    // },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
});
