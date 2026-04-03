import { base, delay, annotation } from '../../../helpers.js';

const test = base.extend({});

test.afterAll(() => delay([100, 'my error']));
test.afterAll(() => delay(100)); // runs
test('test 1', expected(), ({}) => delay(100));

function expected() {
  return annotation(`
totalDuration: 300
status: failed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
afterEach: []
afterAll:
  - title: afterAll hook
    duration: 100
    error: "Error: my error"
  - title: afterAll hook
    duration: 100
afterFixtures: []
`);
}
