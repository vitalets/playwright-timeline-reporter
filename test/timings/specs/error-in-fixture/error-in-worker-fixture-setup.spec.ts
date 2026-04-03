import { base, delay, annotation, fixture } from '../../../helpers.js';

const test = base.extend<{}, { workerFixture: void }>({
  workerFixture: [async ({}, use) => fixture([100, 'my error'], use, 100), { scope: 'worker' }],
});

test('test 1', expected(), ({ workerFixture }) => delay(100));

function expected() {
  return annotation(`
totalDuration: 100
status: failed
beforeAll: []
beforeEach: []
beforeFixtures:
  - title: Fixture "workerFixture"
    scope: worker
    stage: setup
    executedPart: setup
    duration: 100
    error: "Error: my error"
testBody:
  duration: 0
afterEach: []
afterAll: []
afterFixtures: []
`);
}
