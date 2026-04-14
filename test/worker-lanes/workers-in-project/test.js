import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

test(`${dir} (all passing)`, (t) => {
  const lanes = runPlaywright(t);

  // tests of project 3 can be in any order, so unify that
  normalizeLastTestName(lanes);

  assertLanes(lanes, [
    ['p1 spec1 test 1', 'p2 spec1 test 1', 'p2 spec1 test 2', 'p3 spec1 test X'], // prettier-ignore
    ['p1 spec1 test 2', 'p3 spec1 test X'],
  ]);
});

test(`${dir} (one failing)`, (t) => {
  const lanes = runPlaywright(t, {
    env: { FAIL_TEST: 'p2 spec1 test 1' },
  });

  assertLanes(lanes, [
    ['p1 spec1 test 1', 'p2 spec1 test 1', 'p2 spec1 test 2'], // prettier-ignore
    ['p1 spec1 test 2'],
  ]);
});

function normalizeLastTestName(lanes) {
  lanes.forEach(
    (lane) => (lane[lane.length - 1] = lane[lane.length - 1].replace(/test \d/, 'test X')),
  );
}
