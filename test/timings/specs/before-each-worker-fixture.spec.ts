import { base, delay, fixture } from '../helpers.js';

const test = base.extend<{}, { workerFixture: void }>({
  workerFixture: [async ({}, use) => fixture(100, use, 200), { scope: 'worker' }],
});

test.beforeEach(({ workerFixture }) => delay(100));
test.beforeEach(({ workerFixture }) => {});
test('test 1', async ({}) => {
  await delay(100);
  // Must fail this test to see worker teardown timings
  // See: https://github.com/microsoft/playwright/issues/38350
  throw new Error('foo');
});

/* EXPECTED: test 1
totalDuration: 500
status: failed
beforeAll: []
beforeEach:
  - title: beforeEach hook
    duration: 100
  - title: beforeEach hook
    duration: 0
beforeFixtures:
  - title: Fixture "workerFixture"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 100
testBody:
  duration: 100
  error: "Error: foo"
afterEach: []
afterAll: []
afterFixtures:
  - title: Fixture "workerFixture"
    scope: worker
    stage: teardown
    executedPart: teardown
    duration: 200
EXPECTED-END */
