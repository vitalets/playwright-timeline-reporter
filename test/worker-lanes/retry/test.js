import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// Tests that a retried test is assigned to the same lane as its first attempt.
// spec2 test 1 fails; Playwright retries it on a new worker (new workerIndex).
// Lane 1 is ineligible (its last test passed from the same project), so the retry deterministically attaches to lane 2 — no branching.
test(`${dir}`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 1'],
  ]);
});
