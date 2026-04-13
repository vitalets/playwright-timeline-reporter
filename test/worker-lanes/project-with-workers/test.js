/**
 * Worker-lane snapshot test for the dependent-projects scenario.
 */
import { test } from 'node:test';
import path from 'node:path';
import { runPlaywright, assertLanes } from '../helpers.js';

const dir = path.dirname(import.meta.dirname);

test(dir, () => {
  const lanes = runPlaywright(import.meta.dirname);

  // tests of project 3 can be in any order, so unify that
  lanes.forEach(
    (lane) => (lane[lane.length - 1] = lane[lane.length - 1].replace(/test \d/, 'test X')),
  );

  assertLanes(lanes, [
    ['p1 spec1 test 1', 'p3 spec1 test X'], // prettier-ignore
    ['p1 spec1 test 2', 'p2 spec2 test 1', 'p2 spec2 test 2', 'p3 spec1 test X'],
    ['p1 spec1 test 3', 'p3 spec1 test X'],
  ]);
});
