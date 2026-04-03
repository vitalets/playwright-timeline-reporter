import { base as test, delay, annotation } from '../../../helpers.js';

test.afterEach(() => delay(100));
test.afterAll(() => delay(100));
test('test 1', expected(), ({}) => delay([100, 'my error']));

function expected() {
  return annotation(`
totalDuration: 300
status: failed
beforeAll: []
beforeEach: []
beforeFixtures: []
testBody:
  duration: 100
  error: "Error: my error"
afterEach:
  - title: afterEach hook
    duration: 100
afterAll:
  - title: afterAll hook
    duration: 100
afterFixtures: []
`);
}
