import { test } from './fixtures.js';

test.describe('Analytics', () => {
  test('send analytics', { tag: ['@analytics'] }, async ({ page, failingTestFixture }) => {
    // will not run due to error in fixture
  });

  test('send usage', async ({ page, failingTestFixtureWithDelay }) => {
    // will not run due to error in fixture
  });

  test('Send metrics to datadog', async ({ failingWorkerFixture }) => {
    // will not run due to error in fixture
  });

  test('Send metrics to google', async ({ failingWorkerFixtureWithDelay }) => {
    // will not run due to error in fixture
  });
});
