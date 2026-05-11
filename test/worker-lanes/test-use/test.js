import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// Tests lane assignment when test.use() with a worker-scoped fixture forces a worker restart.
// Because workers=1, only one lane is ever active. The restart gives spec2 test 2 a new workerIndex,
// but the assigner retries with allowAttachToPassedTest=true so it can attach to the lane whose
// last test (spec1 test 1) passed — keeping both tests in the single available lane.
test(`${dir}`, (t) => {
  const lanes = runPlaywright(t);
  assertLanes(lanes, [
    ['spec1 test 100', 'spec2 test 100'], // prettier-ignore
  ]);
});
