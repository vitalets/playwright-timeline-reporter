import { test, testBody } from '../../_helpers/pw-test.js';

test('test 300', async ({}, testInfo) => {
  await testBody(testInfo, testInfo.retry ? '' : 'error');
});
