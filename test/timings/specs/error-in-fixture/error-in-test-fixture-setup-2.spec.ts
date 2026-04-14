/**
 * Error in test fixture setup, referenced in beforeAll hook.
 */
import { base, delay, fixture } from '../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture([100, 'my error'], use, 100),
});

test.afterAll(({ testFixture }) => delay(100));
test.afterAll(({ testFixture }) => delay(100));
test('test 1', () => delay(100));

/* EXPECTED: test 1
totalDuration: 300
status: failed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach: []
afterAll:
  - title: afterAll hook
    duration: 0
  - title: afterAll hook
    duration: 0
afterFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: teardown
    executedPart: setup
    duration: 100
    error: "Error: my error"
  - title: Fixture "testFixture"
    scope: test
    stage: teardown
    executedPart: setup
    duration: 100
    error: "Error: my error"
EXPECTED-END */
