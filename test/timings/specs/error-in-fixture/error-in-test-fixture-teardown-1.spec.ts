import { base, delay, fixture } from '../../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture(100, use, [100, 'my error']),
});

test.beforeAll(({ testFixture }) => delay(100));
test('test 1', () => delay(100));

/* EXPECTED: test 1
totalDuration: 300
status: failed
beforeAll:
  - title: beforeAll hook
    duration: 100
beforeEach: []
beforeFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: setup
    executedPart: full-run
    duration: 200
    error: "Error: my error"
testBody:
  duration: 0
afterEach: []
afterAll: []
afterFixtures: []
EXPECTED-END */
