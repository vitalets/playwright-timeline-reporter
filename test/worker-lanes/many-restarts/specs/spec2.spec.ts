import { test, testBody } from '../../_helpers/pw-test.js';

test('fail 400', async ({}, testInfo) => {
  await testBody(testInfo);
});

test('fail 100', async ({}, testInfo) => {
  await testBody(testInfo);
});
