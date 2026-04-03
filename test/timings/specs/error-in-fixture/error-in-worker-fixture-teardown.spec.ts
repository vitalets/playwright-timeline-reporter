import { base, delay, annotation, fixture } from '../../../helpers.js';

const test = base.extend<{}, { workerFixture: void }>({
  workerFixture: [async ({}, use) => fixture(100, use, [100, 'my error']), { scope: 'worker' }],
});

test('test 1', expected(), async ({ workerFixture }) => {
  await delay(100);
});

// Error in worker fixture teardown is not a part of test result.
// It comes to reporter.onError and can't be linked with a specific test.
// Current result is not ideal, because no error is in the test result.
// Hopefully Playwright will improve it in the future.
// See: https://github.com/microsoft/playwright/issues/39063
function expected() {
  return annotation(`
totalDuration: 200
status: passed
beforeAll: []
beforeEach: []
beforeFixtures:
  - title: Fixture "workerFixture"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 100
testBody:
  duration: 100
afterEach: []
afterAll: []
afterFixtures: []
`);
}
