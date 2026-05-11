import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// With one worker restart and non-fully-parallel mode, the heuristic prefers zero split files,
// so spec2's tests (which share a file) stay on the same lane despite the new workerIndex —
// producing the same layout as the no-restarts case.
test(`${dir} (non fully-parallel)`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2'],
  ]);
});

// Skipped: in fully-parallel mode there is no split-files penalty, and a single restart gap always yields
// variability=0 regardless of assignment, so the algorithm cannot distinguish branches — lane outcome is non-deterministic.
test.skip(`${dir} (fully-parallel)`, (t) => {
  const lanes = runPlaywright(t, { flags: '--fully-parallel' });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec2 test 2'], // prettier-ignore
    ['spec2 test 1'],
  ]);
});
