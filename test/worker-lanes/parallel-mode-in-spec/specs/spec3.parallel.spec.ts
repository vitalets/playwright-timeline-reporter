import { test, testBody } from '../../_helpers/pw-test.js';

// tests in this file should stick to other lanes
// because of the 'parallel' mode.

if (process.env.PARALLEL_MODE_ENABLED) {
  test.describe.configure({ mode: 'parallel' });
}

test('fail 400', async ({}, testInfo) => {
  await testBody(testInfo);
});

test('test 300', async ({}, testInfo) => {
  await testBody(testInfo);
});

test('test 100', async ({}, testInfo) => {
  await testBody(testInfo);
});
