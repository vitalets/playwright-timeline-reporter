import { base, delay, fixture } from '../../helpers.js';

const test = base.extend<{ testFixture1: void; testFixture2: void; testFixture3: void }>({
  testFixture1: async ({}, use) => fixture(100, use, 200),
  testFixture2: async ({}, use) => fixture(200, use, 0),
  testFixture3: async ({}, use) => fixture(150, use, 100),
});

test('test 1', ({ testFixture1, testFixture2, testFixture3 }) => delay(100));
