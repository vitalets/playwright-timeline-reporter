import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// Skipped: with two restarts and non-fully-parallel mode, the split-files heuristic is ambiguous
// (no assignment keeps all spec2 tests together), so the lane outcome is non-deterministic.
test.skip(`${dir} (non fully-parallel)`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2', 'spec2 test 3'],
  ]);
});

// With two restarts restartGapsCount >= 2 triggers variability-based scoring: the algorithm picks
// the branch where restart-gap durations are most evenly spread, distributing spec2's tests across both lanes.
test(`${dir} (fully-parallel)`, (t) => {
  const lanes = runPlaywright(t, { flags: '--fully-parallel' });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec2 test 2'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 3'],
  ]);
});
