import { test, testBody } from '../../_helpers/pw-test.js';

// Use JS for the new lock option so typechecking still works with older Playwright versions.
test('locked 200', { lock: 'shared-resource' }, async ({}, testInfo) => {
  await testBody(testInfo);
});
