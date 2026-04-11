/**
 * Phase 2: beam search to assign tests to lanes (see index.ts for full description).
 */
import { TestTimings } from '../../../test-timings/types.js';
import { WorkerLane, cloneLanes } from './lane.js';
import { scoreBranch, scoreRecentBranch } from './scoring.js';
import { testRef } from './debug.js';

/** Algorithm context passed unchanged through the beam search loop. */
export type AssignContext = {
  /** Set of tests that are the last test for their workerIndex (from Phase 1). */
  lastTestInWorker: Set<TestTimings>;
  /** Global peak concurrency from Phase 1 — hard upper bound on simultaneous lanes. */
  maxParallelWorkers: number;
  /** Per-project peak concurrency from Phase 1 — used for lane consolidation. */
  maxParallelWorkersPerProject: Map<string, number>;
  /** Maximum number of partial lane states kept after each pruning step. */
  maxBranches: number;
  /**
   * Number of most-recent restart gaps per project to use when scoring beams during pruning.
   * Using only recent gaps makes the pruning signal sensitive to the latest decisions instead
   * of being diluted by the long history of identical early gaps shared by all beams.
   * Pruning is also deferred until this many gaps have accumulated — before that the variance
   * signal is too weak to distinguish beams reliably.
   * The final winner selection still uses all gaps for global quality.
   */
  restartsCountUntilPruningBranches: number;
  /** Debug logger (no-op when debug mode is off). */
  log: (...args: unknown[]) => void;
};

/** A single partial solution tracked by the beam search. */
type BeamState = { lanes: WorkerLane[] };

/**
 * Assigns test timings to lanes via iterative beam search.
 *
 * For each test (in startTime order), every tracked BeamState is expanded into one or
 * more successor states (one per candidate lane). After expansion the pool is pruned
 * back to beamWidth by restart-gap variance score — but only once enough gaps have
 * accumulated to make the variance signal meaningful.
 *
 * Returns the best-scored lanes on completion, or null if all states were discarded
 * (constraint violation — should not occur with valid input).
 */
export function beamAssign(
  tests: TestTimings[],
  initialLanes: WorkerLane[],
  ctx: AssignContext,
): WorkerLane[] | null {
  let beams: BeamState[] = [{ lanes: initialLanes }];
  for (const test of tests) {
    const nextBeams: BeamState[] = [];
    for (const beam of beams) {
      expandBeam(beam, test, ctx, nextBeams);
    }
    if (nextBeams.length === 0) return null;
    beams = pruneBeams(nextBeams, ctx);
  }
  beams.sort((a, b) => scoreBranch(a.lanes) - scoreBranch(b.lanes));
  return beams[0].lanes;
}

// ─── Beam expansion ────────────────────────────────────────────────────────────

/**
 * Expand one beam state for the next test, pushing successor states into `out`.
 *
 * Step A: if an existing lane already tracks this workerIndex, the test continues
 *   that worker — exactly one successor, no branching.
 * Step B/C: new workerIndex — branch into each eligible candidate lane or open a
 *   fresh slot from the pre-created pool.
 */
function expandBeam(
  beam: BeamState,
  test: TestTimings,
  ctx: AssignContext,
  out: BeamState[],
): void {
  const laneIdx = beam.lanes.findIndex((l) => l.lastWorkerIndex === test.workerIndex);
  if (laneIdx >= 0) {
    const next = cloneLanes(beam.lanes);
    next[laneIdx].tests.push(test);
    out.push({ lanes: next });
    return;
  }
  expandNewWorker(beam, test, ctx, out);
}

/** Expand a beam for a test whose workerIndex has not been seen in this beam yet. */
function expandNewWorker(
  beam: BeamState,
  test: TestTimings,
  ctx: AssignContext,
  out: BeamState[],
): void {
  const candidates = getCandidateLanes(beam.lanes, test, ctx);
  if (candidates.length === 0) {
    const freshState = tryFreshLane(beam.lanes, test, ctx);
    if (freshState) out.push(freshState);
    return;
  }
  for (const candidate of candidates) {
    const next = cloneLanes(beam.lanes);
    next[beam.lanes.indexOf(candidate)].tests.push(test);
    out.push({ lanes: next });
  }
}

// ─── Beam pruning ─────────────────────────────────────────────────────────────

/**
 * Prune the beam pool to beamWidth states.
 * Beams are ranked by scoreRecentBranch (last pruningWindowSize gaps per project) so that
 * pruning decisions reflect the most recent assignments rather than the long shared history.
 * Pruning is skipped until at least minWorkerRestartsBeforePruning gaps exist in ANY beam.
 */
function pruneBeams(beams: BeamState[], ctx: AssignContext): BeamState[] {
  if (beams.length <= ctx.maxBranches) return beams;
  const maxGaps = Math.max(...beams.map((b) => countRestartGaps(b.lanes)));
  if (maxGaps < ctx.restartsCountUntilPruningBranches) return beams;
  beams.sort(
    (a, b) =>
      scoreRecentBranch(a.lanes, ctx.restartsCountUntilPruningBranches) -
      scoreRecentBranch(b.lanes, ctx.restartsCountUntilPruningBranches),
  );
  const pruned = beams.slice(0, ctx.maxBranches);
  ctx.log(`  pruned ${beams.length} → ${pruned.length} beams (maxGaps=${maxGaps})`);
  return pruned;
}

/** Count same-project worker-restart gap events across all lanes in a state. */
function countRestartGaps(lanes: WorkerLane[]): number {
  return lanes.reduce((sum, lane) => sum + countLaneRestartGaps(lane), 0);
}

function countLaneRestartGaps(lane: WorkerLane): number {
  let count = 0;
  for (let i = 1; i < lane.tests.length; i++) {
    const prev = lane.tests[i - 1];
    const curr = lane.tests[i];
    if (prev.projectName === curr.projectName && prev.workerIndex !== curr.workerIndex) count++;
  }
  return count;
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
  lanes: WorkerLane[],
  test: TestTimings,
  ctx: AssignContext,
): WorkerLane[] {
  let candidates = lanes.filter(
    (lane) =>
      lane.lastTest !== undefined &&
      ctx.lastTestInWorker.has(lane.lastTest) &&
      lane.lastTestEndTime <= test.startTime,
  );
  const projectLanesUsed = lanes.filter((lane) =>
    lane.tests.some((t) => t.projectName === test.projectName),
  ).length;
  const maxForProject = ctx.maxParallelWorkersPerProject.get(test.projectName) ?? 1;
  if (projectLanesUsed >= maxForProject) {
    candidates = candidates.filter((lane) =>
      lane.tests.some((t) => t.projectName === test.projectName),
    );
  }
  candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);
  return candidates;
}

/**
 * No eligible candidate lanes — try opening a fresh slot from the pre-created pool.
 * Returns null (this beam state is discarded) if opening a new slot would exceed
 * the peak concurrency observed in Phase 1.
 */
function tryFreshLane(
  lanes: WorkerLane[],
  test: TestTimings,
  ctx: AssignContext,
): BeamState | null {
  const activeLanes = lanes.filter((l) => l.lastTestEndTime > test.startTime);
  if (activeLanes.length >= ctx.maxParallelWorkers) {
    ctx.log(
      `  C: ${testRef(test)} → DISCARD` +
        ` (activeLanes=${activeLanes.length} >= maxParallelWorkers=${ctx.maxParallelWorkers})`,
    );
    return null;
  }
  const unusedLane = lanes.find((l) => l.tests.length === 0);
  if (!unusedLane) {
    ctx.log(`  C: ${testRef(test)} → DISCARD (no unused lane in pool)`);
    return null;
  }
  const laneIdx = lanes.indexOf(unusedLane);
  ctx.log(`  C: ${testRef(test)} → lane[${laneIdx}] (new slot, activeLanes=${activeLanes.length})`);
  const next = cloneLanes(lanes);
  next[laneIdx].tests.push(test);
  return { lanes: next };
}
