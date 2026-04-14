import { test } from 'node:test';
import { getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test.skip(`${dir} (non fully-parallel)`, () => {
  const lanes = runPlaywright(dir);
  assertLanes(lanes, [
    ['spec1 test 1'], // prettier-ignore
    ['spec2 test 1', 'spec2 test 2'],
  ]);
});

test(`${dir} (fully-parallel)`, () => {
  const lanes = runPlaywright(dir, { flags: '--fully-parallel' });
  assertLanes(lanes, [
    ['spec1 test 1', 'spec2 test 2'], // prettier-ignore
    ['spec2 test 1'],
  ]);
});
