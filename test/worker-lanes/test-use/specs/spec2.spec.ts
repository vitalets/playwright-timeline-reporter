import { test, testBody } from '../../_helpers/pw-test.js';

// Invocation of test.use() with worker-scoped fixture triggers worker restart for this file.
// See: https://github.com/microsoft/playwright/blob/main/tests/playwright-test/test-use.spec.ts#L100
// See: https://github.com/microsoft/playwright/issues/33316
test.use({ screenshot: 'off' });

test('test 2', async ({}, testInfo) => {
  await testBody(testInfo, 100);
});
