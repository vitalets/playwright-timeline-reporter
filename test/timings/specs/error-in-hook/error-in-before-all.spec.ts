import { base, delay } from '../../../helpers.js';

const test = base.extend({});

test.beforeAll(() => delay([100, 'my error']));
test.beforeAll(() => delay(100)); // runs
test.beforeEach(() => delay(100)); // does not run
test.afterEach(() => delay(100)); // does not run
test.afterAll(() => delay(100)); // runs
test('test 1', ({}) => delay(100));

/* EXPECTED: test 1
totalDuration: 300
status: failed
beforeAll:
  - title: beforeAll hook
    duration: 100
    error: "Error: my error"
  - title: beforeAll hook
    duration: 100
beforeEach: []
beforeFixtures: []
testBody:
  duration: 0
afterEach: []
afterAll:
  - title: afterAll hook
    duration: 100
afterFixtures: []
EXPECTED-END */
