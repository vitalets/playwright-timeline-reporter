import { base, delay, annotation } from '../../../helpers.js';

const test = base.extend({});

test.beforeEach(() => delay([100, 'my error']));
test.beforeEach(() => delay(100)); // runs
test.afterEach(() => delay(100)); // runs
test.afterAll(() => delay(100)); // runs
test('test 1', expected(), ({}) => delay(100));

function expected() {
  return annotation(`
totalDuration: 400
status: failed
beforeAll: []
beforeEach:
  - title: beforeEach hook
    duration: 100
    error: "Error: my error"
  - title: beforeEach hook
    duration: 100
beforeFixtures: []
testBody:
  duration: 0
afterEach:
  - title: afterEach hook
    duration: 100
afterAll:
  - title: afterAll hook
    duration: 100
afterFixtures: []
`);
}
