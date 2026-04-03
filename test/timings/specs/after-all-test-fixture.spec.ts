import { base, delay, annotation, fixture } from '../../helpers.js';

const test = base.extend<{ testFixture: void }>({
  testFixture: async ({}, use) => fixture(100, use, 200),
});

test.afterAll(({ testFixture }) => delay(100));
test('test 1', expected(), ({}) => delay(100));

function expected() {
  return annotation(`
totalDuration: 500
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
afterFixtures:
  - title: Fixture "testFixture"
    scope: test
    stage: teardown
    executedPart: full-run
    duration: 300
`);
}
