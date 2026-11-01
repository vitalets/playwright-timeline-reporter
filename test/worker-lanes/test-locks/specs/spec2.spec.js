import { test, testBody } from '../../_helpers/pw-test.js';

test('locked 300', { lock: 'shared-resource' }, async ({}, testInfo) => {
  await testBody(testInfo);
});
