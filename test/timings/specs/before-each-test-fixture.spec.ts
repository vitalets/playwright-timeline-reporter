import { base, delay, fixture } from '../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture(100, use, 200),
});

test.beforeEach(({ testFixture }) => delay(100));
test('test 1', ({}) => delay(100));

/* EXPECTED: test 1
totalDuration: 500
status: passed
beforeAll: []
beforeEach:
  - title: beforeEach hook
    duration: 100
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
    duration: 200
EXPECTED-END */
