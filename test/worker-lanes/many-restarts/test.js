import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// Tests lane assignment across 3 spec files when workers restart many times (every spec throws an error).
// With restartGapsCount >= 2 the algorithm switches to restart-gaps variability scoring:
// it picks the branch where restart-gap durations are most evenly distributed across lanes.
// This results in spec1+spec3 tests grouped in lane 1 and spec2 tests in lane 2.
test(`${dir}`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1', 'spec3 test 1', 'spec3 test 2'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2'],
  ]);
});
