import { test, testBody } from '../../_helpers/pw-test.js';

test('fail 200', async ({}, testInfo) => {
  await testBody(testInfo);
});
