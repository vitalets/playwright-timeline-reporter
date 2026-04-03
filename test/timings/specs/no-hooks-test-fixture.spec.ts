import { base, delay, annotation, fixture } from '../../helpers.js';

const base1 = base.extend<{ testFixture3: void }>({
  testFixture3: async ({}, use) => fixture(100, use, 100),
});
const test = base1.extend<{ testFixture: void; testFixture2: void }>({
  testFixture: async ({ testFixture2, testFixture3 }, use) => fixture(100, use, 200),
  testFixture2: async ({}, use) => fixture(100, use, 100),
});
test('test 1', expected(), ({ testFixture }) => delay(100));

function expected() {
  return annotation(`
totalDuration: 800
status: passed
beforeAll: []
beforeEach: []
beforeFixtures:
  - title: Fixture "testFixture2"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
  - title: Fixture "testFixture3"
    scope: test
    stage: setup
    executedPart: setup
    duration: 100
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
    duration: 200
  - title: Fixture "testFixture3"
    scope: test
    stage: teardown
    executedPart: teardown
    duration: 100
  - title: Fixture "testFixture2"
    scope: test
    stage: teardown
    executedPart: teardown
    duration: 100
`);
}
