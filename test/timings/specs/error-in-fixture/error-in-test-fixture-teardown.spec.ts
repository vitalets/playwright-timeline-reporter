import { base, delay, annotation, fixture } from '../../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture(100, use, [100, 'my error']),
});

test('test 1', expected(), ({ testFixture }) => delay(100));

function expected() {
  return annotation(`
totalDuration: 300
status: failed
beforeAll: []
beforeEach: []
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
    duration: 100
    error: "Error: my error"
`);
}
