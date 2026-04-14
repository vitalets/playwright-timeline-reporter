import { test, testBody } from '../../_helpers/pw-test.js';

test('test 1', async ({}, testInfo) => {
  await testBody(testInfo, 300);
});

test('test 2', async ({}, testInfo) => {
  await testBody(testInfo, 100);
});
