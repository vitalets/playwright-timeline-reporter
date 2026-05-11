import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// With parallel mode disabled, all spec3 tests share one worker and stay sequentially in a single lane,
// each spec file occupying its own lane with no cross-file spreading.
test(`${dir} (parallel mode disabled)`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1'],
    ['spec3 test 1', 'spec3 test 2', 'spec3 test 3'],
  ]);
});

// With parallel mode enabled, each test in spec3 gets its own Playwright worker (distinct workerIndex),
// so the algorithm opens a new lane for each, spreading spec3 tests across 3 lanes alongside spec1 and spec2.
test(`${dir} (parallel mode enabled)`, (t) => {
  const lanes = runPlaywright(t, { env: { PARALLEL_MODE_ENABLED: '1' } });
  // spec3 test 2 and spec3 test 3 can be assigned to either lane depending on non-deterministic
  // Playwright worker scheduling. Normalize both to a placeholder before asserting.
  normalizeSpec3Tests(lanes);
  assertLanes(lanes, [
    ['spec1 test 1', 'spec3 test X'], // prettier-ignore
    ['spec2 test 1', 'spec3 test X'],
    ['spec3 test 1'],
  ]);
});

function normalizeSpec3Tests(lanes) {
  lanes.forEach((lane, i) => {
    if (i < 2) lane[1] = lane[1].replace(/spec3 test [23]/, 'spec3 test X');
  });
}
