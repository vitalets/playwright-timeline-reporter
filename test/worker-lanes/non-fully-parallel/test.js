import { test } from 'node:test';
import { runPlaywright, assertLanes } from '../helpers.js';

test('non-fully-parallel', () => {
  const lanes = runPlaywright(import.meta.dirname);
  assertLanes(lanes, [
    ['spec1 test 1', 'spec3 test 2'], // prettier-ignore
    ['spec2 test 1'],
    ['spec3 test 1'],
  ]);
});
