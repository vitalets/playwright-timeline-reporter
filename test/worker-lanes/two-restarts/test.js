import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test.skip(`${dir} (non fully-parallel)`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2', 'spec2 test 3'],
  ]);
});

test(`${dir} (fully-parallel)`, (t) => {
  const lanes = runPlaywright(t, { flags: '--fully-parallel' });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec2 test 2'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 3'],
  ]);
});
