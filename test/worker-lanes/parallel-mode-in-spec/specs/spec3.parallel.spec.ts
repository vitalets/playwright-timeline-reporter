import { test, testBody } from '../../_helpers/pw-test.js';

// tests in this file should stick to other lanes
// because of the 'parallel' mode.

test.describe.configure({ mode: 'parallel' });

test('test 1', async ({}, testInfo) => {
  await testBody(testInfo, 400);
});

test('test 2', async ({}, testInfo) => {
  await testBody(testInfo, 100);
});

test('test 3', async ({}, testInfo) => {
  await testBody(testInfo, 100);
});
