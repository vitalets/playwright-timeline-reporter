import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test(`${dir} (p mode enabled)`, (t) => {
  const lanes = runPlaywright(t, { env: { PARALLEL_MODE_ENABLED: '1' } });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec3 test 2'], // prettier-ignore
    ['spec2 test 1', 'spec3 test 3'],
    ['spec3 test 1'],
  ]);
});

test(`${dir} (p mode disabled)`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1'],
    ['spec3 test 1', 'spec3 test 2', 'spec3 test 3'],
  ]);
});
