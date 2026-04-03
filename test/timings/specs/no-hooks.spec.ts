import { base as test, delay, annotation } from '../../helpers.js';

test('test 1', expected(), ({}) => delay(100));

function expected() {
  return annotation(`
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
`);
}
