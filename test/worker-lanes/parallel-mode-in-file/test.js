/**
 * Worker-lane snapshot test for the parallel-mode-in-file scenario.
 */
import { test } from 'node:test';
import { getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test(dir, () => {
  const lanes = runPlaywright(dir);
  assertLanes(lanes, [
    ['spec1 test 1', 'spec4 test 2'], // prettier-ignore
    ['spec2 test 1'],
    ['spec3 test 1'],
    ['spec4 test 1', 'spec4 test 3', 'spec2 test 2'],
  ]);
});
