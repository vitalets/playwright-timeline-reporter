import { base, delay, fixture } from '../../helpers.js';

const test = base.extend<{ testFixtureAuto: void; testFixtureAutoInHook: void }>({
  testFixtureAuto: [async ({}, use) => fixture(100, use, 200), { auto: true }],
  testFixtureAutoInHook: [async ({}, use) => fixture(150, use, 100), { auto: true }],
});

test.beforeEach(({ testFixtureAutoInHook }) => delay(0));

test('test 1', ({}) => delay(100));

/* EXPECTED: test 1
totalDuration: 650
status: passed
beforeAll: []
beforeEach:
  - title: beforeEach hook
    duration: 0
beforeFixtures:
  - title: Fixture "testFixtureAuto"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
  - title: Fixture "testFixtureAutoInHook"
    scope: test
    stage: setup
    executedPart: setup
    duration: 150
testBody:
  duration: 100
afterEach: []
afterAll: []
afterFixtures:
  - title: Fixture "testFixtureAutoInHook"
    scope: test
    stage: teardown
    executedPart: teardown
    duration: 100
  - title: Fixture "testFixtureAuto"
    scope: test
    stage: teardown
    executedPart: teardown
    duration: 200
EXPECTED-END */
