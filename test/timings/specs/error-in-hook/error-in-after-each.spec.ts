import { base, delay } from '../../../helpers.js';

const test = base.extend({});

test.afterEach(() => delay([100, 'my error']));
test.afterEach(() => delay(100)); // runs
test.afterAll(() => delay(100)); // runs
test('test 1', ({}) => delay(100));

/* EXPECTED: test 1
totalDuration: 400
status: failed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach:
  - title: afterEach hook
    duration: 100
    error: "Error: my error"
  - title: afterEach hook
    duration: 100
afterAll:
  - title: afterAll hook
    duration: 100
afterFixtures: []
EXPECTED-END */
