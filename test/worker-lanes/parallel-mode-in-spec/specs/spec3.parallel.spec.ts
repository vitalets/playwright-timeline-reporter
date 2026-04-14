import { test, testBody } from '../../_helpers/pw-test.js';

// tests in this file should stick to other lanes
// because of the 'parallel' mode.

if (process.env.PARALLEL_MODE_ENABLED) {
  test.describe.configure({ mode: 'parallel' });
}

test('test 1', async ({}, testInfo) => {
  await testBody(testInfo, 400, 'error');
});

test('test 2', async ({}, testInfo) => {
  await testBody(testInfo, 300);
});

test('test 3', async ({}, testInfo) => {
  await testBody(testInfo, 100);
});
