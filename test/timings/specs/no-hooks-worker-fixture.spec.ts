import { base, delay, annotation, fixture } from '../../helpers.js';

const test = base.extend<{}, { workerFixture: void; workerFixture2: void }>({
  workerFixture: [async ({ workerFixture2 }, use) => fixture(100, use, 200), { scope: 'worker' }],
  workerFixture2: [async ({}, use) => fixture(100, use, 0), { scope: 'worker' }],
});

test('test 1', expected(), async ({ workerFixture }) => {
  await delay(100);
  // Must fail this test to see worker teardown timings
  // See: https://github.com/microsoft/playwright/issues/38350
  throw new Error('foo');
});

function expected() {
  return annotation(`
totalDuration: 500
status: failed
beforeAll: []
beforeEach: []
beforeFixtures:
  - title: Fixture "workerFixture2"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 100
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
  - title: Fixture "workerFixture2"
    scope: worker
    stage: teardown
    executedPart: teardown
    duration: 0    
`);
}
