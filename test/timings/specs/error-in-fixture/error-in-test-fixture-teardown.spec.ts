import { base, delay, fixture } from '../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture(100, use, [100, 'my error']),
});

test('test 1', ({ testFixture }) => delay(100));

/* EXPECTED: test 1
totalDuration: 300
status: failed
beforeAll: []
beforeEach: []
beforeFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
testBody:
  duration: 100
afterEach: []
afterAll: []
afterFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: teardown
    executedPart: teardown
    duration: 100
    error: "Error: my error"
EXPECTED-END */
