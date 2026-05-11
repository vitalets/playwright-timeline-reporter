import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// Tests that without failures, tests stay on their original worker lanes with no branching.
// spec1 test 1 opens lane 1 (worker 0); spec2 test 1 opens lane 2 (worker 1), spec2 test 2 appends to it (Step A — same workerIndex).
// No new workerIndex ever appears after its lane is opened, so the algorithm never branches.
test(`${dir}`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2'],
  ]);
});
