import { base as test, delay } from '../helpers.js';

test('test 1', ({}) => delay(100));

/* EXPECTED: test 1
totalDuration: 100
status: passed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach: []
afterAll: []
afterFixtures: []
EXPECTED-END */
