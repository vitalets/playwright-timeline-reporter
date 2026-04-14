import { base, delay, fixture } from '../../helpers.js';

const test = base.extend<{}, { workerFixtureAuto: void; workerFixtureAutoInHook: void }>({
  workerFixtureAuto: [async ({}, use) => fixture(100, use, 200), { scope: 'worker', auto: true }],
  workerFixtureAutoInHook: [
    async ({}, use) => fixture(150, use, 100),
    { scope: 'worker', auto: true },
  ],
});

test.beforeAll(({ workerFixtureAutoInHook }) => delay(0));
test('test 1', async ({}) => {
  await delay(100);
  // Must fail this test to see worker teardown timings
  // See: https://github.com/microsoft/playwright/issues/38350
  throw new Error('foo');
});

/* EXPECTED: test 1
totalDuration: 650
status: failed
beforeAll:
  - title: beforeAll hook
    duration: 0
beforeEach: []
beforeFixtures:
  - title: Fixture "workerFixtureAuto"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 100
  - title: Fixture "workerFixtureAutoInHook"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 150
testBody:
  duration: 100
  error: "Error: foo"
afterEach: []
afterAll: []
afterFixtures:
  - title: Fixture "workerFixtureAutoInHook"
    scope: worker
    stage: teardown
    executedPart: teardown
    duration: 100
  - title: Fixture "workerFixtureAuto"
    scope: worker
    stage: teardown
    executedPart: teardown
    duration: 200
EXPECTED-END */
