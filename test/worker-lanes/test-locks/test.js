import { test, getDir, runPlaywright, assertLanes, pwVersion } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);
const skip = pwVersion('<', '1.63');

// A shared lock serializes tests across files, despite fullyParallel and workers: 2.
test(`${dir} (shared lock only)`, { skip }, (t) => {
  const lanes = runPlaywright(t, { flags: '--grep=locked' });
  assertLanes(lanes, [['spec1 locked 200', 'spec2 locked 300']]);
});

// The independent test can occupy a second lane while the locked tests run sequentially.
test(`${dir} (with independent test)`, { skip }, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 locked 200', 'spec2 locked 300'], // prettier-ignore
    ['spec3 independent 1200'],
  ]);
});
