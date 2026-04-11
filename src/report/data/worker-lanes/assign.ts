/**
 * Phase 2: recursive backtracking to assign tests to lanes (see index.ts for full description).
 */
import { TestTimings } from '../../../test-timings/types.js';
import { WorkerLane, cloneLanes } from './lane.js';
import { pickBestBranch } from './scoring.js';
import { testRef } from './debug.js';

// ─── Public API ────────────────────────────────────────────────────────────────

/** Algorithm context passed unchanged through all recursive calls. */
export type AssignContext = {
  /** Set of tests that are the last test for their workerIndex (from Phase 1). */
  lastTestInWorker: Set<TestTimings>;
  /** Global peak concurrency from Phase 1 — hard upper bound on simultaneous lanes. */
  maxParallelWorkers: number;
  /** Per-project peak concurrency from Phase 1 — used for lane consolidation. */
  maxParallelWorkersPerProject: Map<string, number>;
  /** Debug logger (no-op when debug mode is off). */
  log: (...args: unknown[]) => void;
};

/**
 * Assign `tests` to `lanes` via recursive backtracking.
 * Returns the completed lanes on success, or null if this branch must be discarded.
 *
 * Backtracking structure:
 *   assignTests([t1, t2, …], lanes, ctx)
 *     → Step A: same workerIndex found → push and recurse (no branch)
 *     → Step B/C: try each candidate lane → recurse → collect survivors → pick best
 */
export function assignTests(
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  if (tests.length === 0) return lanes;
  // Try same-worker continuation first (unambiguous — at most one lane can match).
  const sameWorker = trySameWorker(tests, lanes, ctx);
  if (sameWorker !== undefined) return sameWorker;
  // New workerIndex: find eligible candidate lanes and branch.
  return handleNewWorker(tests, lanes, ctx);
}

// ─── Step A: same workerIndex ─────────────────────────────────────────────────

/**
 * If an existing lane's last test shares this test's workerIndex, the test was run
 * by the same Playwright worker process — append it to that lane with no branching.
 * Returns undefined when no matching lane exists (fall through to Step B/C).
 */
function trySameWorker(
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null | undefined {
  const [test, ...rest] = tests;
  const laneIdx = lanes.findIndex((lane) => lane.lastWorkerIndex === test.workerIndex);
  if (laneIdx < 0) return undefined;
  ctx.log(`  A: ${testRef(test)} → lane[${laneIdx}] (same workerIndex)`);
  const next = cloneLanes(lanes);
  next[laneIdx].tests.push(test);
  return assignTests(rest, next, ctx);
}

// ─── Steps B + C: new workerIndex ─────────────────────────────────────────────

function handleNewWorker(
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  const candidates = getCandidateLanes(tests[0], lanes, ctx);
  if (candidates.length === 0) return tryFreshLane(tests, lanes, ctx);
  if (candidates.length === 1) return tryCandidateAt(candidates[0], tests, lanes, ctx);
  return branchAllCandidates(candidates, tests, lanes, ctx);
}

/**
 * No existing lane is eligible. Open a fresh slot from the pre-created pool.
 *
 * Guard: count "activeLanes" — lanes still running at this test's start time.
 * If that count already equals maxParallelWorkers, opening another slot would
 * exceed the physical peak concurrency observed in Phase 1, which is impossible.
 * Discard this branch.
 */
function tryFreshLane(
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  const [test, ...rest] = tests;
  const activeLanes = lanes.filter((l) => l.lastTestEndTime > test.startTime);
  if (activeLanes.length >= ctx.maxParallelWorkers) {
    ctx.log(
      `  C: ${testRef(test)} → DISCARD` +
        ` (activeLanes=${activeLanes.length} >= maxParallelWorkers=${ctx.maxParallelWorkers})`,
    );
    return null;
  }
  // Claim the next unused lane from the pre-created pool.
  const unusedLane = lanes.find((l) => l.tests.length === 0);
  if (!unusedLane) {
    // All pre-created slots are taken but activeLanes < maxParallelWorkers — shouldn't happen.
    ctx.log(`  C: ${testRef(test)} → DISCARD (no unused lane in pool)`);
    return null;
  }
  const laneIdx = lanes.indexOf(unusedLane);
  ctx.log(`  C: ${testRef(test)} → lane[${laneIdx}] (new slot, activeLanes=${activeLanes.length})`);
  const next = cloneLanes(lanes);
  next[laneIdx].tests.push(test);
  return assignTests(rest, next, ctx);
}

/** Exactly one eligible lane — append and recurse without branching. */
function tryCandidateAt(
  candidate: WorkerLane,
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  const [test, ...rest] = tests;
  const laneIdx = lanes.indexOf(candidate);
  ctx.log(`  B: ${testRef(test)} → lane[${laneIdx}] (1 candidate)`);
  const next = cloneLanes(lanes);
  next[laneIdx].tests.push(test);
  return assignTests(rest, next, ctx);
}

/**
 * Two or more eligible lanes — try each as a separate branch (in endTime ascending order),
 * collect all non-null results, and pick the best-scoring one.
 * Returns null only if every branch is discarded.
 */
function branchAllCandidates(
  candidates: WorkerLane[],
  tests: TestTimings[],
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  const [test, ...rest] = tests;
  const idxs = candidates.map((c) => lanes.indexOf(c));
  ctx.log(`  B: ${testRef(test)} → branching into lanes [${idxs.join(', ')}]`);
  const results = candidates
    .map((c) => {
      const next = cloneLanes(lanes);
      next[lanes.indexOf(c)].tests.push(test);
      return assignTests(rest, next, ctx);
    })
    .filter((r): r is WorkerLane[] => r !== null);
  if (results.length === 0) {
    ctx.log(`  B: ${testRef(test)} → all branches discarded`);
    return null;
  }
  ctx.log(`  B: ${testRef(test)} → ${results.length}/${candidates.length} survived, picking best`);
  return pickBestBranch(results);
}

// ─── Candidate lane collection ─────────────────────────────────────────────────

/**
 * Collect lanes eligible to receive a test whose workerIndex has not been seen yet.
 *
 * A lane is eligible when ALL of the following hold:
 *   1. Its last test is in lastTestInWorker — its worker has no further tests
 *      scheduled, so the lane can be taken over by a new worker.
 *   2. Its last test's end time ≤ this test's start time — the lane is idle.
 *   3. (Lane consolidation) If the project has already occupied its per-project
 *      maximum number of concurrent lanes in this branch, restrict to lanes that
 *      already have tests from this project. This prevents a project with workers:1
 *      (all tests failing) from spreading across lanes — each failure bumps workerIndex,
 *      but all must funnel into the one established project lane.
 *
 * NOTE: There is intentionally no same-project/clean-ended exclusion.
 * The lastTestInWorker guard already ensures the predecessor worker is truly finished.
 * Adding a status-based exclusion would conflict with the consolidation rule when the
 * only free project lane ended with a passing test.
 */
function getCandidateLanes(
  test: TestTimings,
  lanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] {
  let candidates = lanes.filter(
    (lane) =>
      lane.lastTest !== undefined &&
      ctx.lastTestInWorker.has(lane.lastTest) &&
      lane.lastTestEndTime <= test.startTime,
  );
  // Lane consolidation: if project is at its parallel capacity, restrict to existing project lanes.
  const projectLanesUsed = lanes.filter((lane) =>
    lane.tests.some((t) => t.projectName === test.projectName),
  ).length;
  const maxForProject = ctx.maxParallelWorkersPerProject.get(test.projectName) ?? 1;
  if (projectLanesUsed >= maxForProject) {
    candidates = candidates.filter((lane) =>
      lane.tests.some((t) => t.projectName === test.projectName),
    );
  }
  // Sort most-recently-freed first so branches are explored in a predictable order.
  candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);
  return candidates;
}
