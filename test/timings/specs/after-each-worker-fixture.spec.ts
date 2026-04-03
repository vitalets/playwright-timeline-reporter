import { base, delay, annotation, fixture } from '../../helpers.js';

const test = base.extend<{}, { workerFixture: void }>({
  workerFixture: [async ({}, use) => fixture(100, use, 200), { scope: 'worker' }],
});

test.afterEach(({ workerFixture }) => delay(100));
test.afterEach(({ workerFixture }) => {});
test('test 1', expected(), async ({}) => {
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
beforeFixtures: []
testBody:
  duration: 100
  error: "Error: foo"
afterEach:
  - title: afterEach hook
    duration: 100
  - title: afterEach hook
    duration: 0
afterAll: []
afterFixtures:
  - title: Fixture "workerFixture"
    scope: worker
    stage: teardown
    executedPart: full-run
    duration: 300
`);
}
