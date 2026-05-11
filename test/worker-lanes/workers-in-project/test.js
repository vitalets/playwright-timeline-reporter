import { test, getDir, runPlaywright, assertLanes } from '../_helpers/pw-run.js';

const dir = getDir(import.meta);

// With 3 projects (p1 → p2 → p3) and p2 limited to workers:1, the per-project worker cap is tracked
// during parallel-index analysis so p2 tests are consolidated onto one lane. p1 uses both lanes,
// and p3 tests appear at the end of both lanes once p2 finishes.
test(`${dir} (all passing)`, (t) => {
  const lanes = runPlaywright(t);

  // tests of project 3 can be in any order, so unify that
  normalizeLastTestName(lanes);

  assertLanes(lanes, [
    ['p1 spec1 test 100', 'p2 spec1 test 100', 'p2 spec1 test 200', 'p3 spec1 test X'], // prettier-ignore
    ['p1 spec1 test 200', 'p3 spec1 test X'],
  ]);
});

// When p2 spec1 test 100 fails (triggering a worker restart inside p2), p2 still stays on one lane
// because its worker cap is 1. p1 tests remain correctly split across both lanes.
test(`${dir} (one failing)`, (t) => {
  const lanes = runPlaywright(t, {
    env: { FAIL_TEST: 'p2 spec1 test 100' },
  });

  assertLanes(lanes, [
    ['p1 spec1 test 100', 'p2 spec1 test 100', 'p2 spec1 test 200'], // prettier-ignore
    ['p1 spec1 test 200'],
  ]);
});

function normalizeLastTestName(lanes) {
  lanes.forEach(
    (lane) => (lane[lane.length - 1] = lane[lane.length - 1].replace(/test \d+/, 'test X')),
  );
}
