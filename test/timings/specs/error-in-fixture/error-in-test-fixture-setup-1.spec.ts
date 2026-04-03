/**
 * Error in test fixture setup, referenced in beforeAll hook.
 */
import { base, delay, annotation, fixture } from '../../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture([100, 'my error'], use, 100),
});

test.beforeAll(({ testFixture }) => delay(100));
test.beforeAll(({ testFixture }) => delay(100));
test('test 1', expected(), () => delay(100));

function expected() {
  return annotation(`
totalDuration: 200
status: failed
beforeAll:
  - title: beforeAll hook
    duration: 0
  - title: beforeAll hook
    duration: 0
beforeEach: []
beforeFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
    error: "Error: my error"
  - title: Fixture "testFixture"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
    error: "Error: my error"
testBody:
  duration: 0
afterEach: []
afterAll: []
afterFixtures: []
`);
}
