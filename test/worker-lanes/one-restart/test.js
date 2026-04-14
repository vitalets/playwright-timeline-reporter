import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test(`${dir} (non fully-parallel)`, () => {
  const lanes = runPlaywright(dir);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2'],
  ]);
});

// this test is expected to fail, because there is not way to define
// why "test 2" should stick to the lane 1 instead of lane 2.
test.skip(`${dir} (fully-parallel)`, () => {
  const lanes = runPlaywright(dir, { flags: '--fully-parallel' });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec2 test 2'], // prettier-ignore
    ['spec2 test 1'],
  ]);
});
