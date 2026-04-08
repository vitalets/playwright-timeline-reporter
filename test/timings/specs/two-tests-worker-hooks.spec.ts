import { base as test, delay } from '../../helpers.js';

test.beforeAll(() => delay(100));
test.afterAll(() => delay(100));

// always run as suite

test.describe('suite 1', () => {
  test('test 1', () => delay(100));
  test('test 2', () => delay(100));
});

/* EXPECTED: test 1
totalDuration: 200
status: passed
beforeAll:
  - title: beforeAll hook
    duration: 100
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach: []
afterAll: []
afterFixtures: []
EXPECTED-END */

/* EXPECTED: test 2
totalDuration: 200
status: passed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach: []
afterAll:
  - title: afterAll hook
    duration: 100
afterFixtures: []
EXPECTED-END */
